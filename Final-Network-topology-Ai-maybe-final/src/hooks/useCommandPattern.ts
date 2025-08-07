import { useCallback, useState, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

// Command Interface
export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  merge?(other: Command): Command | null;
  getDescription(): string;
}

// Add Node Command
export class AddNodeCommand implements Command {
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

  redo() {
    this.execute();
  }

  getDescription() {
    return `Add ${this.node.type} node`;
  }
}

// Delete Node Command
export class DeleteNodeCommand implements Command {
  constructor(
    private nodeId: string,
    private deletedNode: Node,
    private setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    private setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
    private deletedEdges: Edge[] = []
  ) {}

  execute() {
    // Remove node and connected edges
    this.setNodes(nodes => nodes.filter(n => n.id !== this.nodeId));
    this.setEdges(edges => {
      const remainingEdges = edges.filter(e => 
        e.source !== this.nodeId && e.target !== this.nodeId
      );
      this.deletedEdges = edges.filter(e => 
        e.source === this.nodeId || e.target === this.nodeId
      );
      return remainingEdges;
    });
  }

  undo() {
    this.setNodes(nodes => [...nodes, this.deletedNode]);
    this.setEdges(edges => [...edges, ...this.deletedEdges]);
  }

  redo() {
    this.execute();
  }

  getDescription() {
    return `Delete ${this.deletedNode.type} node`;
  }
}

// Move Node Command
export class MoveNodeCommand implements Command {
  constructor(
    private nodeId: string,
    private oldPosition: { x: number; y: number },
    private newPosition: { x: number; y: number },
    private setNodes: React.Dispatch<React.SetStateAction<Node[]>>
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

  redo() {
    this.execute();
  }

  merge(other: Command): Command | null {
    if (other instanceof MoveNodeCommand && other.nodeId === this.nodeId) {
      return new MoveNodeCommand(
        this.nodeId,
        this.oldPosition,
        other.newPosition,
        this.setNodes
      );
    }
    return null;
  }

  getDescription() {
    return `Move node`;
  }
}

// Update Node Command
export class UpdateNodeCommand implements Command {
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

  redo() {
    this.execute();
  }

  getDescription() {
    return `Update node properties`;
  }
}

// Composite Command (for multiple operations)
export class CompositeCommand implements Command {
  constructor(
    private commands: Command[],
    private description: string
  ) {}

  execute() {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo() {
    // Undo in reverse order
    [...this.commands].reverse().forEach(cmd => cmd.undo());
  }

  redo() {
    this.execute();
  }

  getDescription() {
    return this.description;
  }
}

// Command Manager Hook
export const useCommandPattern = () => {
  const [undoStack, setUndoStack] = useState<Command[]>([]);
  const [redoStack, setRedoStack] = useState<Command[]>([]);
  const MAX_HISTORY_SIZE = 100;
  const isExecutingRef = useRef(false);

  const executeCommand = useCallback((command: Command) => {
    if (isExecutingRef.current) return;
    
    isExecutingRef.current = true;
    
    // Try to merge with last command
    setUndoStack(stack => {
      const lastCommand = stack[stack.length - 1];
      if (lastCommand && lastCommand.merge) {
        const merged = lastCommand.merge(command);
        if (merged) {
          // Replace last command with merged one
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
    lastCommand.redo();
    
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
      nextCommand: redoStack[redoStack.length - 1]?.getDescription()
    };
  }, [undoStack, redoStack]);

  return {
    executeCommand,
    undo,
    redo,
    clearHistory,
    getHistoryInfo,
    undoStack,
    redoStack
  };
};