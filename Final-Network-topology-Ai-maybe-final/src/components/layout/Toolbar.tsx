import React from 'react';
import {
  RotateCcw, RotateCw, Save, FolderOpen, Plus, Trash2, Download, Upload, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNetworkDiagram } from '../../hooks/useNetworkDiagram';

export interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSave: () => void;
  onOpen: () => void;
  onImport: () => void;
  onNew: () => void;
  onDelete: () => void;
  onExport: (format: 'json' | 'svg' | 'png') => void;
  onClose: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onUndo, onRedo, onClear, onCopy, onPaste, onSave, onOpen, onImport, onNew, onDelete, onExport, onClose
}) => {
  const { undoStack, redoStack, getHistoryInfo } = useNetworkDiagram();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Undo/Redo/Clear group */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onUndo} variant="ghost" size="sm" className="hover:bg-yellow-50" disabled={undoStack.length === 0}>
              <RotateCcw className="w-4 h-4" />
              {undoStack.length > 0 && (
                <span className="ml-1 text-xs text-gray-500">({undoStack.length})</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-center">
              <div className="font-medium">ย้อนกลับ (Undo)</div>
              <div className="text-xs text-gray-400">
                {getHistoryInfo().undoCount} steps
                {getHistoryInfo().lastCommand && (
                  <div>ล่าสุด: {getHistoryInfo().lastCommand}</div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onRedo} variant="ghost" size="sm" className="hover:bg-yellow-50" disabled={redoStack.length === 0}>
              <RotateCw className="w-4 h-4" />
              {redoStack.length > 0 && (
                <span className="ml-1 text-xs text-gray-500">({redoStack.length})</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-center">
              <div className="font-medium">ทำซ้ำ (Redo)</div>
              <div className="text-xs text-gray-400">
                {getHistoryInfo().redoCount} steps
                {getHistoryInfo().nextCommand && (
                  <div>ถัดไป: {getHistoryInfo().nextCommand}</div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onClear} variant="ghost" size="sm" className="hover:bg-yellow-50">
              ล้าง
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">ล้างแผนผัง</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-8 mx-2" />
        {/* Copy/Paste group */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onCopy} variant="ghost" size="sm" className="hover:bg-purple-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">คัดลอก</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">คัดลอก (Ctrl+C)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onPaste} variant="ghost" size="sm" className="hover:bg-purple-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">วาง</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">วาง (Ctrl+V)</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-8 mx-2" />
        {/* Project group */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onSave} variant="ghost" size="sm" className="hover:bg-blue-50">
              <Save className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">บันทึก</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">บันทึกโปรเจกต์</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onOpen} variant="ghost" size="sm" className="hover:bg-blue-50">
              <FolderOpen className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">เปิด</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">เปิดโปรเจกต์</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onImport} variant="ghost" size="sm" className="hover:bg-blue-50">
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">นำเข้า</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">นำเข้า JSON</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onNew} variant="ghost" size="sm" className="hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">สร้างใหม่</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">สร้างโปรเจกต์ใหม่</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onDelete} variant="ghost" size="sm" className="hover:bg-blue-50">
              <Trash2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">ลบ</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">ลบโปรเจกต์</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-8 mx-2" />
        {/* Export group */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-green-50">
                  <Upload className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">ส่งออก</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">ส่งออกไฟล์</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onExport('json')}>JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('svg')}>SVG</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('png')}>PNG</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Close Project group */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-red-600 hover:bg-red-100">
              <LogOut className="w-4 h-4 mr-1 text-red-600" />
              <span className="hidden sm:inline">ปิด</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">บันทึกและปิดโปรเจกต์</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default Toolbar;
