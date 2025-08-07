import React from 'react';
import { Edit3, LogOut } from 'lucide-react';
import { useNetworkDiagram } from '../../hooks/useNetworkDiagram';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import Toolbar from './Toolbar';
import type { ToolbarProps } from './Toolbar';

interface HeaderProps {
  isEditingProjectName: boolean;
  projectNameInputRef: React.RefObject<HTMLInputElement>;
  onProjectNameKeyDown: (e: React.KeyboardEvent) => void;
  onProjectNameSave: () => void;
  onProjectNameEdit: () => void;
  onLogout: () => void;
  toolbarProps: ToolbarProps;
}

const Header: React.FC<HeaderProps> = ({
  isEditingProjectName,
  projectNameInputRef,
  onProjectNameKeyDown,
  onProjectNameSave,
  onProjectNameEdit,
  onLogout,
  toolbarProps,
}) => {
  const { projectName, setProjectName } = useNetworkDiagram();

  return (
    <div className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex flex-col gap-1">
        {/* Project Name */}
        {isEditingProjectName ? (
          <div className="flex items-center gap-2">
            <input
              ref={projectNameInputRef}
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={onProjectNameSave}
              onKeyDown={onProjectNameKeyDown}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={50}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-xs">
              {projectName}
            </h1>
            <button
              onClick={onProjectNameEdit}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title="แก้ไขชื่อโปรเจกต์"
            >
              <Edit3 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <Toolbar {...toolbarProps} />
      </div>

      {/* Logout Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-200"
            >
              <LogOut className="w-4 h-4 mr-1 text-red-600" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">ออกจากระบบ</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default Header;
