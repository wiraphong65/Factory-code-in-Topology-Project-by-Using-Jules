import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
} from '@xyflow/react';
import type { ReactFlowProps, OnNodeDrag } from '@xyflow/react';
import { nodeTypes, edgeTypes } from '../../config/flowConfig';

interface FlowCanvasProps extends Omit<ReactFlowProps, 'nodeTypes' | 'edgeTypes'> {
  onNodeDrag: OnNodeDrag;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({ onNodeDrag, ...props }) => {
  const reactFlowProps = useMemo(() => ({
    ...props,
    nodeTypes,
    edgeTypes,
    connectionMode: ConnectionMode.Loose,
    connectionRadius: 50,
    snapToGrid: false,
    snapGrid: [15, 15] as [number, number],
    connectionLineStyle: { stroke: '#6366f1', strokeWidth: 2 },
    fitView: false,
    selectionKeyCode: null,
    selectionOnDrag: true,
    panOnDrag: false,
    panActivationKeyCode: "Shift",
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
    selectNodesOnDrag: false,
    multiSelectionKeyCode: "Shift",
    deleteKeyCode: null, // We handle delete via keyboard shortcut hook
    defaultViewport: { x: 0, y: 0, zoom: 1 },
    minZoom: 0.1,
    maxZoom: 4,
    zoomOnScroll: true,
    zoomOnPinch: true,
    zoomOnDoubleClick: true,
    preventScrolling: true,
  }), [props]);

  return (
    <ReactFlow
      {...reactFlowProps}
      onNodeDrag={onNodeDrag}
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
};

export default React.memo(FlowCanvas);
