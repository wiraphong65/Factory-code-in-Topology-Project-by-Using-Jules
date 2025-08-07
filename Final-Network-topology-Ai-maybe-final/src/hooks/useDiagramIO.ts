import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useNetworkDiagram } from './useNetworkDiagram';
import { exportToPng, exportAsSvgWithBase64Icons } from '../components/exportUtils';

interface DiagramIOProps {
  flowWrapper: React.RefObject<HTMLDivElement>;
  setExportModalOpen: (isOpen: boolean) => void;
}

export const useDiagramIO = ({ flowWrapper, setExportModalOpen }: DiagramIOProps) => {
  const {
    nodes,
    edges,
    projectName,
    setProjectName,
    loadDiagramFromData,
    saveDiagram, // from useNetworkDiagram
  } = useNetworkDiagram();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportType, setExportType] = useState<'json' | 'png' | 'svg'>('png');
  const [exportFileName, setExportFileName] = useState('');

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('กรุณาเลือกไฟล์ JSON เท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const diagramData = JSON.parse(e.target?.result as string);
        if (!diagramData.nodes || !Array.isArray(diagramData.nodes)) {
          toast.error('ไฟล์ JSON ไม่มีโครงสร้างที่ถูกต้อง (ไม่มี nodes)');
          return;
        }
        loadDiagramFromData(JSON.stringify(diagramData));
        if (diagramData.projectName) {
          setProjectName(diagramData.projectName);
        } else {
          setProjectName(file.name.replace('.json', ''));
        }
        toast.success('นำเข้าไฟล์ JSON สำเร็จ');
      } catch (error) {
        console.error('Error importing JSON:', error);
        toast.error('ไม่สามารถอ่านไฟล์ JSON ได้');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const saveDiagramWithCustomName = (fileName: string) => {
    try {
      const diagramData = JSON.stringify({ nodes, edges }, null, 2);
      const blob = new Blob([diagramData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("บันทึกไฟล์ JSON สำเร็จ");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ JSON");
    }
  };

  const saveAsSVGWithCustomName = async (fileName: string) => {
    try {
      const reactFlowElement = flowWrapper.current?.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowElement || nodes.length === 0) {
        toast.error("ไม่พบแผนผังสำหรับบันทึก");
        return;
      }
      const success = await exportAsSvgWithBase64Icons(reactFlowElement, nodes, edges, fileName);
      if (success) {
        toast.success("บันทึกไฟล์ SVG สำเร็จ");
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ SVG");
      }
    } catch (e) {
      console.error('Error saving SVG:', e);
      toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ SVG");
    }
  };

  const saveAsPNGWithCustomName = async (fileName: string) => {
    try {
      const reactFlowElement = flowWrapper.current?.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowElement || nodes.length === 0) {
        toast.error("ไม่พบแผนผังสำหรับบันทึก");
        return;
      }
      const success = await exportToPng(reactFlowElement, nodes, edges, fileName);
      if (success) {
        toast.success("บันทึกไฟล์ PNG สำเร็จ");
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ PNG");
      }
    } catch (e) {
      console.error('Error saving PNG:', e);
      toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ PNG");
    }
  };

  const handleOpenExportModal = () => {
    const defaultFileName = `${projectName.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    setExportFileName(defaultFileName);
    setExportModalOpen(true);
  };

  const handleExportConfirm = () => {
    if (!exportFileName.trim()) {
      toast.error("กรุณากรอกชื่อไฟล์");
      return;
    }
    setExportModalOpen(false);
    switch (exportType) {
      case 'json':
        saveDiagramWithCustomName(exportFileName);
        break;
      case 'svg':
        saveAsSVGWithCustomName(exportFileName);
        break;
      case 'png':
        saveAsPNGWithCustomName(exportFileName);
        break;
    }
  };

  const handleExportFormat = (format: 'json' | 'svg' | 'png') => {
    switch (format) {
      case 'json':
        saveDiagram(); // This is the simple save from useNetworkDiagram
        break;
      case 'svg':
        saveAsSVGWithCustomName(projectName || 'diagram');
        break;
      case 'png':
        saveAsPNGWithCustomName(projectName || 'diagram');
        break;
    }
  };

  return {
    fileInputRef,
    exportType,
    setExportType,
    exportFileName,
    setExportFileName,
    handleImport,
    handleFileSelect,
    handleOpenExportModal,
    handleExportConfirm,
    handleExportFormat,
  };
};
