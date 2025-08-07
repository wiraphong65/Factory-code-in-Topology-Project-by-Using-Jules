import { useEffect } from 'react';
import { toast } from 'sonner';
import type { Node, Edge, OnNodesChange, OnEdgesChange } from '@xyflow/react';

interface KeyboardHandlersProps {
  handleSaveProject: () => void;
  handleOpenExportModal: () => void;
  handleCopy: () => void;
  handlePaste: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

export const useKeyboardHandlers = ({
  handleSaveProject,
  handleOpenExportModal,
  handleCopy,
  handlePaste,
  handleUndo,
  handleRedo,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: KeyboardHandlersProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
        return;
      }

      const isCtrl = event.ctrlKey || event.metaKey; // for Mac
      const isShift = event.shiftKey;

      if (isCtrl && event.code === 'KeyS') {
        event.preventDefault();
        if (isShift) {
          handleOpenExportModal();
        } else {
          handleSaveProject();
        }
        return;
      }

      if (isCtrl && event.code === 'KeyC') {
        event.preventDefault();
        handleCopy();
        return;
      }

      if (isCtrl && event.code === 'KeyV') {
        event.preventDefault();
        handlePaste();
        return;
      }

      if (isCtrl && event.code === 'KeyZ') {
        event.preventDefault();
        if (isShift) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if (isCtrl && event.code === 'KeyY') {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(node => node.selected);
        const selectedEdges = edges.filter(edge => edge.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();
          const nodesToRemove = selectedNodes.map(node => node.id);
          const connectedEdges = edges.filter(edge =>
            nodesToRemove.includes(edge.source) || nodesToRemove.includes(edge.target)
          );
          const allEdgesToRemove = [...new Set([...selectedEdges.map(e => e.id), ...connectedEdges.map(e => e.id)])];

          onNodesChange(selectedNodes.map(node => ({ id: node.id, type: 'remove' })));
          onEdgesChange(allEdgesToRemove.map(edgeId => ({ id: edgeId, type: 'remove' })));

          toast.success(`ลบ ${selectedNodes.length} อุปกรณ์ และ ${allEdgesToRemove.length} การเชื่อมต่อสำเร็จ`);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleSaveProject,
    handleOpenExportModal,
    handleCopy,
    handlePaste,
    handleUndo,
    handleRedo,
  ]);
};
