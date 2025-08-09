import { useCallback, useState, useRef, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';

// Delta-based change tracking
interface Delta {
  type: 'node_add' | 'node_remove' | 'node_move' | 'node_update' | 'edge_add' | 'edge_remove' | 'edge_update';
  target: string;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
}

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
  compressed?: boolean;
}

// Compression utilities removed - not used in current implementation

export const useAdvancedUndo = (
  nodes: Node[],
  edges: Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
) => {
  // Hybrid approach: Commands + Snapshots
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [snapshots, setSnapshots] = useState<Map<number, Snapshot>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  
  const SNAPSHOT_INTERVAL = 20; // Create snapshot every 20 operations
  const MAX_DELTAS = 200;
  const isUndoRedoRef = useRef(false);

  // Create snapshot
  const createSnapshot = useCallback((_index: number): Snapshot => {
    return {
      nodes: nodes.map(n => ({ ...n })),
      edges: edges.map(e => ({ ...e })),
      timestamp: Date.now(),
      compressed: false
    };
  }, [nodes, edges]);

  // Add delta
  const addDelta = useCallback((delta: Delta) => {
    if (isUndoRedoRef.current) return;

    setDeltas(prevDeltas => {
      const newDeltas = [...prevDeltas.slice(0, currentIndex), delta];
      
      // Limit delta history
      if (newDeltas.length > MAX_DELTAS) {
        return newDeltas.slice(-MAX_DELTAS);
      }
      
      return newDeltas;
    });

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setMaxIndex(newIndex);

    // Create snapshot at intervals
    if (newIndex % SNAPSHOT_INTERVAL === 0) {
      setSnapshots(prev => {
        const newSnapshots = new Map(prev);
        newSnapshots.set(newIndex, createSnapshot(newIndex));
        
        // Keep only recent snapshots
        const keysToDelete = Array.from(newSnapshots.keys())
          .filter(key => key < newIndex - (SNAPSHOT_INTERVAL * 10));
        keysToDelete.forEach(key => newSnapshots.delete(key));
        
        return newSnapshots;
      });
    }
  }, [currentIndex, createSnapshot, MAX_DELTAS, SNAPSHOT_INTERVAL]);

  // Find nearest snapshot
  const findNearestSnapshot = useCallback((targetIndex: number): { snapshot: Snapshot; index: number } | null => {
    const snapshotIndices = Array.from(snapshots.keys())
      .filter(index => index <= targetIndex)
      .sort((a, b) => b - a);

    if (snapshotIndices.length === 0) {
      return null;
    }

    const nearestIndex = snapshotIndices[0];
    const snapshot = snapshots.get(nearestIndex);
    
    return snapshot ? { snapshot, index: nearestIndex } : null;
  }, [snapshots]);

  // Apply delta
  const applyDelta = useCallback((delta: Delta, reverse: boolean = false) => {
    const { type, target, oldValue, newValue } = delta;
    
    switch (type) {
      case 'node_add':
        if (reverse) {
          setNodes(nodes => nodes.filter(n => n.id !== target));
        } else {
          setNodes(nodes => [...nodes, newValue]);
        }
        break;
        
      case 'node_remove':
        if (reverse) {
          setNodes(nodes => [...nodes, oldValue]);
        } else {
          setNodes(nodes => nodes.filter(n => n.id !== target));
        }
        break;
        
      case 'node_move':
        setNodes(nodes => nodes.map(node => 
          node.id === target 
            ? { ...node, position: reverse ? oldValue : newValue }
            : node
        ));
        break;
        
      case 'node_update':
        setNodes(nodes => nodes.map(node => 
          node.id === target 
            ? { ...node, data: { ...node.data, ...(reverse ? oldValue : newValue) } }
            : node
        ));
        break;
        
      case 'edge_add':
        if (reverse) {
          setEdges(edges => edges.filter(e => e.id !== target));
        } else {
          setEdges(edges => [...edges, newValue]);
        }
        break;
        
      case 'edge_remove':
        if (reverse) {
          setEdges(edges => [...edges, oldValue]);
        } else {
          setEdges(edges => edges.filter(e => e.id !== target));
        }
        break;
    }
  }, [setNodes, setEdges]);

  // Restore from snapshot and replay deltas
  const restoreToIndex = useCallback((targetIndex: number) => {
    isUndoRedoRef.current = true;

    const nearestSnapshot = findNearestSnapshot(targetIndex);
    
    if (nearestSnapshot) {
      // Restore from snapshot
      setNodes(nearestSnapshot.snapshot.nodes.map(n => ({ ...n })));
      setEdges(nearestSnapshot.snapshot.edges.map(e => ({ ...e })));
      
      // Replay deltas from snapshot to target
      const deltasToReplay = deltas.slice(nearestSnapshot.index, targetIndex);
      deltasToReplay.forEach(delta => applyDelta(delta, false));
    } else {
      // No snapshot available, apply all deltas from beginning
      setNodes([]);
      setEdges([]);
      
      const deltasToReplay = deltas.slice(0, targetIndex);
      deltasToReplay.forEach(delta => applyDelta(delta, false));
    }

    setCurrentIndex(targetIndex);
    
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 10);
  }, [deltas, findNearestSnapshot, setNodes, setEdges, applyDelta]);

  // Public API
  const undo = useCallback(() => {
    if (currentIndex <= 0) return;
    restoreToIndex(currentIndex - 1);
  }, [currentIndex, restoreToIndex]);

  const redo = useCallback(() => {
    if (currentIndex >= maxIndex) return;
    restoreToIndex(currentIndex + 1);
  }, [currentIndex, maxIndex, restoreToIndex]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < maxIndex;

  // Helper functions for common operations
  const recordNodeAdd = useCallback((node: Node) => {
    addDelta({
      type: 'node_add',
      target: node.id,
      newValue: node,
      timestamp: Date.now()
    });
  }, [addDelta]);

  const recordNodeRemove = useCallback((node: Node) => {
    addDelta({
      type: 'node_remove',
      target: node.id,
      oldValue: node,
      timestamp: Date.now()
    });
  }, [addDelta]);

  const recordNodeMove = useCallback((nodeId: string, oldPos: any, newPos: any) => {
    addDelta({
      type: 'node_move',
      target: nodeId,
      oldValue: oldPos,
      newValue: newPos,
      timestamp: Date.now()
    });
  }, [addDelta]);

  const recordNodeUpdate = useCallback((nodeId: string, oldData: any, newData: any) => {
    addDelta({
      type: 'node_update',
      target: nodeId,
      oldValue: oldData,
      newValue: newData,
      timestamp: Date.now()
    });
  }, [addDelta]);

  const clearHistory = useCallback(() => {
    setDeltas([]);
    setSnapshots(new Map());
    setCurrentIndex(0);
    setMaxIndex(0);
  }, []);

  // Statistics
  const getStats = useMemo(() => ({
    deltaCount: deltas.length,
    snapshotCount: snapshots.size,
    currentIndex,
    maxIndex,
    canUndo,
    canRedo,
    memoryUsage: {
      deltas: deltas.length * 100, // rough estimate
      snapshots: snapshots.size * 1000 // rough estimate
    }
  }), [deltas.length, snapshots.size, currentIndex, maxIndex, canUndo, canRedo]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    recordNodeAdd,
    recordNodeRemove,
    recordNodeMove,
    recordNodeUpdate,
    getStats
  };
};