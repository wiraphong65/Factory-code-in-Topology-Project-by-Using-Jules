import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  setFileName: (name: string) => void;
  exportType: 'json' | 'png' | 'svg';
  setExportType: (type: 'json' | 'png' | 'svg') => void;
  onConfirm: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  fileName,
  setFileName,
  exportType,
  setExportType,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ส่งออกแผนผังเครือข่าย</DialogTitle>
          <DialogDescription>
            เลือกรูปแบบไฟล์และชื่อไฟล์สำหรับการส่งออกแผนผังเครือข่าย
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="filename" className="text-sm font-medium">
              ชื่อไฟล์
            </Label>
            <input
              id="filename"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ชื่อไฟล์"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">รูปแบบไฟล์</Label>
            <RadioGroup
              value={exportType}
              onValueChange={setExportType}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png" className="text-sm">PNG (รูปภาพ)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="svg" id="svg" />
                <Label htmlFor="svg" className="text-sm">SVG (เวกเตอร์)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="text-sm">JSON (ข้อมูล)</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button onClick={onConfirm} disabled={!fileName.trim()}>
              ส่งออก
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
