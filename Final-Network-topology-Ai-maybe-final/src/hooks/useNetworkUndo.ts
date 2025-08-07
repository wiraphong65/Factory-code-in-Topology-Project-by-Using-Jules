import { useCallback, useState, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

// Command Interface สำหรับ Network Diagram
export interface NetworkCommand {
  execute(): void;
  undo(): void;
  merge?(other: NetworkCommand): NetworkCommand | null;
  getDescription(): string;
  getType(): string;
}

// Add Node Command
export class AddNodeCommand implements NetworkCommand {
  constructor(
    private node: Node,
    private setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  ) {}

  execute() {
    this.setNodes(nodes => [...nodes, this.node]);
  }

  undo() {
    this.setNodes(nodes => nodes.filter(n => n.id !== this.node.id));
  }

  getDescription() {
    return `เพิ่ม ${this.node.type} (${this.node.data?.label || this.node.id})`;
  }

  getType() {
    return 'ADD_NODE';
  }
}

// Delete Node Command (with connected edges)
export class DeleteNodeCommand implements NetworkCommand {
  private deletedEdges: Edge[] = [];

  constructor(
    private nodeId: string,
    private deletedNode: Node,
    private setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    private setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  ) {}

  execute() {
    // Store connected edges before deletion
    this.setEdges(edges => {
      this.deletedEdges = edges.filter(e => 
        e.source === this.nodeId || e.target === this.nodeId
      );
      return edges.filter(e => 
        e.source !== this.nodeId && e.target !== this.nodeId
      );
    });
    
    // Remove the node
    this.setNodes(nodes => nodes.filter(n => n.id !== this.nodeId));
  }

  undo() {
    // Restore the node
    this.setNodes(nodes => [...nodes, this.deletedNode]);
    
    // Restore connected edges
    this.setEdges(edges => [...edges, ...this.deletedEdges]);
  }

  getDescription() {
    return `ลบ ${this.deletedNode.type} (${this.deletedNode.data?.label || this.nodeId})`;
  }

  getType() {
    return 'DELETE_NODE';
  }
}

// Move Node Command (with merging support)
export class MoveNodeCommand implements NetworkCommand {
  constructor(
    private nodeId: string,
    private oldPosition: { x: number; y: number },
    private newPosition: { x: number; y: number },
    private setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    private timestamp: number = Date.now()
  ) {}

  execute() {
    this.setNodes(nodes => 
      nodes.map(node => 
        node.id === this.nodeId 
          ? { ...node, position: this.newPosition }
          : node
      )
    );
  }

  undo() {
    this.setNodes(nodes => 
      nodes.map(node => 
        node.id === this.nodeId 
          ? { ...node, position: this.oldPosition }
          : node
      )
    );
  }

  merge(other: NetworkCommand): NetworkCommand | null {
    if (other instanceof MoveNodeCommand && 
        other.nodeId === this.nodeId &&
        other.timestamp - this.timestamp < 1000) { // Merge within 1 second
      return new MoveNodeCommand(
        this.nodeId,
        this.oldPosition,
        other.newPosition,
        this.setNodes,
        this.timestamp
      );
    }
    return null;
  }

  getDescription() {
    return `ย้าย node`;
  }

  getType() {
    return 'MOVE_NODE';
  }
}

// Update Node Properties Command
export class UpdateNodeCommand implements NetworkCommand {
  constructor(
    private nodeId: string,
    private oldData: any,
    private newData: any,
    private setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  ) {}

  execute() {
    this.setNodes(nodes => 
      nodes.map(node => 
        node.id === this.nodeId 
          ? { ...node, data: { ...node.data, ...this.newData } }
          : node
      )
    );
  }

  undo() {
    this.setNodes(nodes => 
      nodes.map(node => 
        node.id === this.nodeId 
          ? { ...node, data: { ...node.data, ...this.oldData } }
          : node
      )
    );
  }

  getDescription() {
    const keys = Object.keys(this.newData);
    return `แก้ไขคุณสมบัติ ${keys.join(', ')}`;
  }

  getType() {
    return 'UPDATE_NODE';
  }
}

// Add Edge Command
export class AddEdgeCommand implements NetworkCommand {
  constructor(
    private edge: Edge,
    private setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  ) {}

  execute() {
    this.setEdges(edges => [...edges, this.edge]);
  }

  undo() {
    this.setEdges(edges => edges.filter(e => e.id !== this.edge.id));
  }

  getDescription() {
    return `เพิ่มการเชื่อมต่อ`;
  }

  getType() {
    return 'ADD_EDGE';
  }
}

// Delete Edge Command
export class DeleteEdgeCommand implements NetworkCommand {
  constructor(
    private edgeId: string,
    private deletedEdge: Edge,
    private setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  ) {}

  execute() {
    this.setEdges(edges => edges.filter(e => e.id !== this.edgeId));
  }

  undo() {
    this.setEdges(edges => [...edges, this.deletedEdge]);
  }

  getDescription() {
    return `ลบการเชื่อมต่อ`;
  }

  getType() {
    return 'DELETE_EDGE';
  }
}

// Update Edge Command
export class UpdateEdgeCommand implements NetworkCommand {
  constructor(
    private edgeId: string,
    private oldData: any,
    private newData: any,
    private setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  ) {}

  execute() {
    this.setEdges(edges => 
      edges.map(edge => 
        edge.id === this.edgeId 
          ? { ...edge, data: { ...edge.data, ...this.newData } }
          : edge
      )
    );
  }

  undo() {
    this.setEdges(edges => 
      edges.map(edge => 
        edge.id === this.edgeId 
          ? { ...edge, data: { ...edge.data, ...this.oldData } }
          : edge
      )
    );
  }

  getDescription() {
    return `แก้ไขการเชื่อมต่อ`;
  }

  getType() {
    return 'UPDATE_EDGE';
  }
}

// Batch Command (for multiple operations)
export class BatchCommand implements NetworkCommand {
  constructor(
    private commands: NetworkCommand[],
    private description: string
  ) {}

  execute() {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo() {
    // Undo in reverse order
    [...this.commands].reverse().forEach(cmd => cmd.undo());
  }

  getDescription() {
    return this.description;
  }

  getType() {
    return 'BATCH';
  }
}

// Network Undo Hook
export const useNetworkUndo = () => {
  const [undoStack, setUndoStack] = useState<NetworkCommand[]>([]);
  const [redoStack, setRedoStack] = useState<NetworkCommand[]>([]);
  const MAX_HISTORY_SIZE = 100;
  const isExecutingRef = useRef(false);

  const executeCommand = useCallback((command: NetworkCommand) => {
    if (isExecutingRef.current) return;
    
    isExecutingRef.current = true;
    
    setUndoStack(stack => {
      // Try to merge with last command
      const lastCommand = stack[stack.length - 1];
      if (lastCommand && lastCommand.merge && lastCommand.getType() === command.getType()) {
        const merged = lastCommand.merge(command);
        if (merged) {
          // Execute merged command
          merged.execute();
          const newStack = [...stack.slice(0, -1), merged];
          return newStack.length > MAX_HISTORY_SIZE ? newStack.slice(1) : newStack;
        }
      }
      
      // Execute new command
      command.execute();
      const newStack = [...stack, command];
      return newStack.length > MAX_HISTORY_SIZE ? newStack.slice(1) : newStack;
    });
    
    // Clear redo stack
    setRedoStack([]);
    
    setTimeout(() => {
      isExecutingRef.current = false;
    }, 0);
  }, [MAX_HISTORY_SIZE]);

  const undo = useCallback(() => {
    if (undoStack.length === 0 || isExecutingRef.current) return;
    
    isExecutingRef.current = true;
    
    const lastCommand = undoStack[undoStack.length - 1];
    lastCommand.undo();
    
    setUndoStack(stack => stack.slice(0, -1));
    setRedoStack(stack => [...stack, lastCommand]);
    
    setTimeout(() => {
      isExecutingRef.current = false;
    }, 0);
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || isExecutingRef.current) return;
    
    isExecutingRef.current = true;
    
    const lastCommand = redoStack[redoStack.length - 1];
    lastCommand.execute();
    
    setRedoStack(stack => stack.slice(0, -1));
    setUndoStack(stack => {
      const newStack = [...stack, lastCommand];
      return newStack.length > MAX_HISTORY_SIZE ? newStack.slice(1) : newStack;
    });
    
    setTimeout(() => {
      isExecutingRef.current = false;
    }, 0);
  }, [redoStack, MAX_HISTORY_SIZE]);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const getHistoryInfo = useCallback(() => {
    return {
      undoCount: undoStack.length,
      redoCount: redoStack.length,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      lastCommand: undoStack[undoStack.length - 1]?.getDescription(),
      nextCommand: redoStack[redoStack.length - 1]?.getDescription(),
      recentCommands: undoStack.slice(-5).map(cmd => cmd.getDescription()),
      // Debug info
      isExecuting: isExecutingRef.current,
      stackSizes: {
        undo: undoStack.length,
        redo: redoStack.length,
        max: MAX_HISTORY_SIZE
      }
    };
  }, [undoStack, redoStack, MAX_HISTORY_SIZE]);

  return {
    executeCommand,
    undo,
    redo,
    clearHistory,
    getHistoryInfo,
    undoStack,
    redoStack,
    // Command classes for external use
    AddNodeCommand,
    DeleteNodeCommand,
    MoveNodeCommand,
    UpdateNodeCommand,
    AddEdgeCommand,
    DeleteEdgeCommand,
    UpdateEdgeCommand,
    BatchCommand
  };
};