import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonVariant?: 'default' | 'destructive';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'destructive',
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={confirmButtonVariant}
          >
            {confirmButtonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CloseProjectDialog: React.FC<Omit<ConfirmationDialogProps, 'title' | 'description' | 'confirmButtonText'>> = (props) => (
  <ConfirmationDialog
    {...props}
    title="ยืนยันการปิดโปรเจกต์"
    description="จะทำการบันทึกโปรเจกต์นี้แล้วปิด คุณต้องการดำเนินการต่อหรือไม่?"
    confirmButtonText="บันทึกและปิด"
  />
);

export const LogoutDialog: React.FC<Omit<ConfirmationDialogProps, 'title' | 'description' | 'confirmButtonText'>> = (props) => (
  <ConfirmationDialog
    {...props}
    title="ยืนยันการออกจากระบบ"
    description="คุณต้องการออกจากระบบหรือไม่? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป"
    confirmButtonText="ออกจากระบบ"
  />
);

export const ClearDiagramDialog: React.FC<Omit<ConfirmationDialogProps, 'title' | 'description' | 'confirmButtonText'>> = (props) => (
  <ConfirmationDialog
    {...props}
    title="ยืนยันการล้างแผนผัง"
    description="คุณต้องการล้างแผนผังนี้หรือไม่? การเปลี่ยนแปลงทั้งหมดจะหายไป"
    confirmButtonText="ล้างแผนผัง"
  />
);
