import React from "react";

const Devices = [
  { 
    type: 'firewall', 
    image: '/src/img/node/firewall-protection.png', 
    label: 'Firewall', 
    color: 'text-red-600' 
  },
  { 
    type: 'router', 
    image: '/src/img/node/wireless-router.png', 
    label: 'Router', 
    color: 'text-blue-600' 
  },
  { 
    type: 'switch', 
    image: '/src/img/node/switch.png', 
    label: 'Switch', 
    color: 'text-green-600' 
  },
  { 
    type: 'server', 
    image: '/src/img/node/servers.png', 
    label: 'Server', 
    color: 'text-purple-600' 
  },
  { 
    type: 'pc', 
    image: '/src/img/node/pc.png', 
    label: 'PC', 
    color: 'text-gray-600' 
  },
]

interface DeviceToolsBarProps {
  isConnectionMode: boolean;
  onToggleConnectionMode: () => void;
  selectedSourceNode: string | null;
}

export const DeviceToolsBar = ({ isConnectionMode, onToggleConnectionMode, selectedSourceNode }: DeviceToolsBarProps) => {
    const onDragStart = (event: React.DragEvent, nodetype: string) => {
        event.dataTransfer.setData('application/reactflow', nodetype);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
     <div className="w-48 bg-white border-r border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">อุปกรณ์เครือข่าย</h3>
      
      <div className="space-y-2">
        {Devices.map((device) => {
          return (
            <div
              key={device.type}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, device.type)}
            >
              <img 
                src={device.image} 
                alt={device.label}
                className="w-5 h-5 object-contain"
              />
              <span className="text-sm font-medium text-gray-700">{device.label}</span>
            </div>
          );
        })}
      </div>

      {/* Connection Button */}
      <div className="mt-6">
        <button
          onClick={onToggleConnectionMode}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
            isConnectionMode
              ? 'bg-orange-500 border-orange-600 text-white shadow-lg'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <img 
            src="/src/img/node/rj45.png" 
            alt="LAN"
            className="w-4 h-4 object-contain"
          />
          <span className="text-sm font-medium">
            {isConnectionMode ? 'ยกเลิกการเชื่อมต่อ' : 'เชื่อมต่อสาย'}
          </span>
        </button>
        
        {isConnectionMode && (
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-800 font-medium mb-1">โหมดเชื่อมต่อ</p>
            <p className="text-xs text-orange-700">
              {selectedSourceNode 
                ? `เลือกแล้ว: ${selectedSourceNode} - คลิกที่ node ปลายทาง`
                : 'คลิกที่ node ต้นทางเพื่อเริ่มการเชื่อมต่อ'
              }
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 font-medium mb-1">วิธีใช้งาน</p>
        <p className="text-xs text-blue-700">ลากอุปกรณ์ไปวางบนแผนผัง แล้วเชื่อมต่อเข้าด้วยกัน</p>
      </div>
    </div>
    );
}