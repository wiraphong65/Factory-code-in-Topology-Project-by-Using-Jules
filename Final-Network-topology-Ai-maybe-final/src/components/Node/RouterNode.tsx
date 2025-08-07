import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface NodeData {
  label?: string;
  selected?: boolean;
  deviceRole?: string;
  maxThroughput?: number;
  throughputUnit?: string;
}

const RouterNode = ({ data }: { data: NodeData }) => {
  const isSelected = !!data?.selected;
  return (
    <div
      className={
        `relative flex flex-col items-center ` +
        (isSelected ? ' ring-4 ring-yellow-400 ring-offset-2 animate-glow' : '')
      }
      style={isSelected ? { boxShadow: '0 0 16px 4px #ffe066, 0 0 0 4px #ffd700 inset' } : {}}
    >
      <img
        src="/src/img/node/wireless-router.png"
        alt="Router"
        className="w-16 h-16 object-contain"
        draggable={false}
      />
      <div className="text-xs font-bold mt-1 text-center">{data?.label || 'Router'}</div>
      {data?.deviceRole && (
        <div className="text-[10px] text-gray-500 text-center">{data.deviceRole}</div>
      )}
      {data?.maxThroughput && data?.throughputUnit && (
        <div className="text-[10px] text-gray-500 text-center">Throughput {data.maxThroughput} {data.throughputUnit}</div>
      )}
      {/* Invisible handles for connections */}
      <Handle
        type="source"
        position={Position.Top}
        className="w-0 h-0 opacity-0"
        style={{ top: '-1px' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-0 h-0 opacity-0"
        style={{ top: '-1px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-0 h-0 opacity-0"
        style={{ bottom: '-1px' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="w-0 h-0 opacity-0"
        style={{ bottom: '-1px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-0 h-0 opacity-0"
        style={{ left: '-1px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-0 h-0 opacity-0"
        style={{ left: '-1px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-0 h-0 opacity-0"
        style={{ right: '-1px' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        className="w-0 h-0 opacity-0"
        style={{ right: '-1px' }}
      />
    </div>
  );
};

export default memo(RouterNode);
