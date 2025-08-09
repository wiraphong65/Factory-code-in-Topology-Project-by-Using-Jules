import { getBoundingBoxFromDiagram, exportToPng, exportAsSvgWithBase64Icons } from './exportUtils';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlowProvider
} from '@xyflow/react';
import { toast } from 'sonner';

import '@xyflow/react/dist/style.css';
import RouterNode from './Node/RouterNode';
import SwitchNode from './Node/SwitchNode';
import FirewallNode from './Node/FireWallNode';
import ServerNode from './Node/ServerNode';
import PCNode from './Node/PCNode';
import { PropertiesPanel } from './PropertiesPanel';
import { EdgePropertiesPanel } from './EdgePropertiesPanel';
import { DeviceToolsBar } from './DeviceToolsBar';
import { EdgeStyle } from './Edges/EdgeStyle';
import { Button } from './ui/button';
import { Save, FolderOpen, Plus, Trash2, Download, Edit3, LogOut, Upload, RotateCcw, RotateCw } from 'lucide-react';
import { useNetworkDiagram } from '@/hooks/useNetworkDiagram';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { ProjectSelectionModal } from './ProjectSelectionModal';
import AIEntryIcon from './ui/AIEntryIcon';
import AIPanel from './AIPanel';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { CreateProjectModal } from './ui/create-project-modal';
import { DeleteProjectModal } from './ui/delete-project-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Separator } from './ui/separator';

const nodeTypes = {
  router: RouterNode,
  switch: SwitchNode,
  firewall: FirewallNode,
  server: ServerNode,
  pc: PCNode,
};

const edgeTypes = {
  custom: EdgeStyle as any,
};

const NetworkDiagramFlow = React.memo(({ projectSelectionOpen, setProjectSelectionOpen }: { projectSelectionOpen: boolean, setProjectSelectionOpen: (open: boolean) => void }) => {
  const [_projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [_exportSubmenuOpen, setExportSubmenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const flowWrapper = useRef<HTMLDivElement>(null);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);

  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const projectNameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'json' | 'png' | 'svg'>('png');
  const [exportFileName, setExportFileName] = useState('');
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = React.useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [clearDiagramModalOpen, setClearDiagramModalOpen] = useState(false);

  // เพิ่ม auto-save state
  const [, setLastAutoSaved] = useState<Date | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const { logout } = useAuth();
  const {
    currentProject,
    createProject,
    updateProject,
    deleteProject,
    clearCurrentProject
  } = useProject();

  const {
    // State
    nodes,
    edges,
    selectedNode,
    showProperties,
    selectedEdge,
    showEdgeProperties,
    tempEdgeData,
    isConnectionMode,
    selectedSourceNode,
    projectName,

    // Handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDragOver,
    onDrop,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    handleUpdateNode,
    handleSaveEdge,
    handleCancelEdge,
    clearDiagram,
    saveDiagram,
    toggleConnectionMode,
    handleNodeDragStop,

    // Utilities
    setTempEdgeData,
    setShowProperties,
    setShowEdgeProperties,
    setProjectName,
    loadDiagramFromData,
    recoverFromBackup,
    handleUndo,
    handleRedo,
    undoStack,
    redoStack,
    getHistoryInfo,
    handleCopy,
    handlePaste,
  } = useNetworkDiagram();

  // เพิ่ม useEffect เพื่อโหลดข้อมูล diagram เมื่อ currentProject เปลี่ยน
  useEffect(() => {
    if (currentProject && currentProject.diagram_data) {
      try {
        loadDiagramFromData(currentProject.diagram_data);
      } catch (error) {
        console.error('Error loading diagram data:', error);
        toast.error('ไม่สามารถโหลดข้อมูลแผนผังได้');
      }
    } else if (currentProject) {
      // ถ้ามี currentProject แต่ไม่มี diagram_data ให้ล้าง diagram
      clearDiagram();
    }
  }, [currentProject, loadDiagramFromData, clearDiagram]);

  // บันทึก currentProject ลง localStorage เมื่อ component mount
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProjectId', currentProject.id.toString());
      console.log('Saved current project to localStorage:', currentProject.id);
    }
  }, [currentProject]);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (nodes.length === 0 && edges.length === 0) return; // ไม่บันทึกถ้าไม่มีข้อมูล
    if (isAutoSaving) return; // ป้องกันการ auto-save ซ้อน
    if (!currentProject) return; // ไม่ auto-save ถ้าไม่มีโปรเจกต์ที่เลือก

    setIsAutoSaving(true);
    try {
      const diagramData = JSON.stringify({ nodes, edges });
      await updateProject(currentProject.id, {
        name: projectName,
        diagram_data: diagramData
      });

      // บันทึก backup ลง localStorage
      localStorage.setItem('network_diagram_backup', JSON.stringify({
        nodes,
        edges,
        projectName,
        projectId: currentProject.id,
        timestamp: new Date().toISOString()
      }));

      setLastAutoSaved(new Date());
      console.log('Auto-saved at:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [nodes, edges, currentProject, projectName, updateProject]);

  // เริ่ม auto-save เมื่อมีข้อมูลเปลี่ยนแปลง
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      // Clear existing interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }

      // Set new interval - auto-save ทุก 30 วินาที
      autoSaveIntervalRef.current = setInterval(autoSave, 30000);

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [nodes, edges, autoSave]);

  // Recovery function - โหลดข้อมูลจาก backup เมื่อ component mount
  useEffect(() => {
    if (!currentProject && (nodes.length === 0 && edges.length === 0)) {
      const recovered = recoverFromBackup();
      if (recovered) {
        toast.info('พบข้อมูลที่ยังไม่ได้บันทึก ต้องการกู้คืนหรือไม่?');
      }
    }
  }, [currentProject, nodes.length, edges.length, recoverFromBackup]);

  // เพิ่มฟังก์ชัน handleImport
  const handleImport = () => {
    setProjectMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ตรวจสอบว่าเป็นไฟล์ JSON หรือไม่
    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('กรุณาเลือกไฟล์ JSON เท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const diagramData = JSON.parse(e.target?.result as string);

        // ตรวจสอบโครงสร้างข้อมูล
        if (!diagramData.nodes || !Array.isArray(diagramData.nodes)) {
          toast.error('ไฟล์ JSON ไม่มีโครงสร้างที่ถูกต้อง (ไม่มี nodes)');
          return;
        }

        // โหลดข้อมูลลงในแผนผัง
        loadDiagramFromData(JSON.stringify(diagramData));

        // อัปเดตชื่อโปรเจกต์จากไฟล์ (ถ้ามี)
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

    // รีเซ็ต input เพื่อให้สามารถเลือกไฟล์เดิมได้อีกครั้ง
    event.target.value = '';
  };

  // Memoize ReactFlow props to prevent unnecessary re-renders
  const reactFlowProps = useMemo(() => ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDragOver,
    onDrop,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
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
    // Performance optimizations
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
    selectNodesOnDrag: false,
    multiSelectionKeyCode: "Shift",
    deleteKeyCode: "Delete",
    // Disable animations for better performance
    defaultViewport: { x: 0, y: 0, zoom: 1 },
    minZoom: 0.1,
    maxZoom: 4,
    zoomOnScroll: true,
    zoomOnPinch: true,
    zoomOnDoubleClick: true,
    preventScrolling: true,
  }), [
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDragOver,
    onDrop,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
  ]);

  // Add global key handler for Delete key and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keys when not in input fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
        return;
      }

      // Ctrl+S - Save project
      if (event.ctrlKey && event.code === 'KeyS' && !event.shiftKey) {
        event.preventDefault();
        handleSaveProject();
        return;
      }

      // Ctrl+Shift+S - Export
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyS') {
        event.preventDefault();
        handleOpenExportModal();
        return;
      }

      // Ctrl+C - Copy
      if (event.ctrlKey && event.code === 'KeyC' && !event.shiftKey) {
        event.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+V - Paste
      if (event.ctrlKey && event.code === 'KeyV' && !event.shiftKey) {
        event.preventDefault();
        handlePaste();
        return;
      }

      // Delete/Backspace - Delete selected elements
      if ((event.key === 'Delete' || event.key === 'Backspace')) {
        const selectedNodes = nodes.filter(node => node.selected);
        const selectedEdges = edges.filter(edge => edge.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();

          // Remove selected nodes and their connected edges
          const nodesToRemove = selectedNodes.map(node => node.id);
          const edgesToRemove = selectedEdges.map(edge => edge.id);

          // Also remove edges connected to selected nodes
          const connectedEdges = edges.filter(edge =>
            nodesToRemove.includes(edge.source) || nodesToRemove.includes(edge.target)
          );
          const allEdgesToRemove = [...new Set([...edgesToRemove, ...connectedEdges.map(edge => edge.id)])];

          // Update state
          onNodesChange(selectedNodes.map(node => ({ id: node.id, type: 'remove' })));
          onEdgesChange(allEdgesToRemove.map(edgeId => ({ id: edgeId, type: 'remove' })));

          toast.success(`ลบ ${selectedNodes.length} อุปกรณ์ และ ${allEdgesToRemove.length} การเชื่อมต่อสำเร็จ`);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, onNodesChange, onEdgesChange]);

  // Add global key handler for Undo/Redo (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keys when not in input fields
      if (["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement)?.tagName)) {
        return;
      }
      // Undo: Ctrl+Z (and not Shift for Redo)
      if (event.ctrlKey && event.code === 'KeyZ' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((event.ctrlKey && event.code === 'KeyY') || (event.ctrlKey && event.shiftKey && event.code === 'KeyZ')) {
        event.preventDefault();
        handleRedo();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setProjectMenuOpen(false);
        setExportSubmenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Project management functions
  const handleSaveProject = async () => {
    setProjectMenuOpen(false);
    try {
      const diagramData = JSON.stringify({ nodes, edges });
      if (currentProject) {
        await updateProject(currentProject.id, {
          name: projectName,
          diagram_data: diagramData
        });
        toast.success('บันทึกโปรเจกต์สำเร็จ');
        setLastAutoSaved(new Date());
      } else {
        // ถ้าไม่มี currentProject ให้สร้างใหม่
        await createProject({
          name: projectName,
          diagram_data: diagramData
        });
        toast.success('สร้างและบันทึกโปรเจกต์ใหม่สำเร็จ');
        setLastAutoSaved(new Date());
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('บันทึกไม่สำเร็จ');
    }
  };



  const handleNewProject = () => {
    setProjectMenuOpen(false);
    setCreateProjectModalOpen(true);
  };

  const handleCreateProject = async (projectName: string, description: string) => {
    try {
      // ล้าง diagram ก่อน
      clearDiagram();

      // สร้างโปรเจกต์ใหม่
      await createProject({
        name: projectName,
        description: description,
        diagram_data: JSON.stringify({ nodes: [], edges: [] })
      });

      // อัปเดต project name หลังจากสร้างโปรเจกต์สำเร็จ
      setProjectName(projectName);

      toast.success("สร้างโปรเจกต์ใหม่สำเร็จ และเปิดใช้งานแล้ว");
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("ไม่สามารถสร้างโปรเจกต์ใหม่ได้");
    }
  };

  const handleDeleteProject = () => {
    setProjectMenuOpen(false);
    setDeleteProjectModalOpen(true);
  };

  const handleConfirmDeleteProject = async () => {
    if (currentProject) {
      try {
        await deleteProject(currentProject.id);
        clearDiagram();
        setProjectName('โปรเจกต์ใหม่');

        // อัปเดต URL กลับไปหน้า dashboard
        window.history.pushState({}, '', '/');

        toast.success("ลบโปรเจกต์ปัจจุบันสำเร็จ");
      } catch (error) {
        toast.error("ไม่สามารถลบโปรเจกต์ได้");
      }
    }
  };

  const handleProjectNameEdit = () => {
    setIsEditingProjectName(true);
    setTimeout(() => {
      projectNameInputRef.current?.focus();
      projectNameInputRef.current?.select();
    }, 100);
  };

  const handleProjectNameSave = async () => {
    setIsEditingProjectName(false);
    if (currentProject && projectName.trim()) {
      try {
        await updateProject(currentProject.id, { name: projectName });
        toast.success("อัปเดตชื่อโปรเจกต์");
      } catch (error) {
        toast.error("ไม่สามารถบันทึกชื่อโปรเจกต์ได้");
      }
    }
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleProjectNameSave();
    } else if (e.key === 'Escape') {
      setIsEditingProjectName(false);
    }
  };

  // Auto-crop SVG export function with improved bounding box calculation
  const saveAsSVGImproved = async () => {
    try {
      const reactFlowWrapper = flowWrapper.current;
      const reactFlowElement = reactFlowWrapper?.querySelector('.react-flow') as HTMLElement;

      if (!reactFlowElement || nodes.length === 0) {
        toast.error("ไม่พบแผนผังสำหรับบันทึก");
        return;
      }

      const success = await exportAsSvgWithBase64Icons(reactFlowElement, nodes, edges, projectName || 'untitled');

      if (success) {
        const box = getBoundingBoxFromDiagram(nodes, edges);
        if (box) {
          const padding = 50;
          const width = box.xMax - box.xMin + padding * 2;
          const height = box.yMax - box.yMin + padding * 2;
          toast.success(`บันทึกไฟล์ SVG สำเร็จ (${Math.round(width)}×${Math.round(height)}px)`);
        } else {
          toast.success("บันทึกไฟล์ SVG สำเร็จ");
        }
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ SVG");
      }
    } catch (error) {
      console.error('Error saving SVG:', error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ SVG");
    }
  };

  // Auto-crop PNG export function with improved bounding box calculation
  const saveAsPNGImproved = async () => {
    try {
      const reactFlowWrapper = flowWrapper.current;
      const reactFlowElement = reactFlowWrapper?.querySelector('.react-flow') as HTMLElement;

      if (!reactFlowElement || nodes.length === 0) {
        toast.error("ไม่พบแผนผังสำหรับบันทึก");
        return;
      }

      const success = await exportToPng(reactFlowElement, nodes, edges, projectName || 'untitled');

      if (success) {
        const box = getBoundingBoxFromDiagram(nodes, edges);
        if (box) {
          const padding = 50;
          const width = box.xMax - box.xMin + padding * 2;
          const height = box.yMax - box.yMin + padding * 2;
          toast.success(`บันทึกไฟล์ PNG สำเร็จ (${Math.round(width)}×${Math.round(height)}px)`);
        } else {
          toast.success("บันทึกไฟล์ PNG สำเร็จ");
        }
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ PNG");
      }
    } catch (error) {
      console.error('Error saving PNG:', error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ PNG");
    }
  };

  // อัพเดตฟังก์ชัน handleExportFormat
  const handleExportFormat = (format: 'json' | 'svg' | 'png') => {
    setExportSubmenuOpen(false);
    setProjectMenuOpen(false);
    switch (format) {
      case 'json':
        saveDiagram();
        break;
      case 'svg':
        saveAsSVGImproved();
        break;
      case 'png':
        saveAsPNGImproved();
        break;
    }
  };



  const handleOpenExportModal = () => {
    // Set default filename based on project name and current date
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
      const reactFlowWrapper = flowWrapper.current;
      const reactFlowElement = reactFlowWrapper?.querySelector('.react-flow') as HTMLElement;

      if (!reactFlowElement || nodes.length === 0) {
        toast.error("ไม่พบแผนผังสำหรับบันทึก");
        return;
      }

      const success = await exportAsSvgWithBase64Icons(reactFlowElement, nodes, edges, fileName);

      if (success) {
        const box = getBoundingBoxFromDiagram(nodes, edges);
        if (box) {
          const padding = 50;
          const width = box.xMax - box.xMin + padding * 2;
          const height = box.yMax - box.yMin + padding * 2;
          toast.success(`บันทึกไฟล์ SVG สำเร็จ (${Math.round(width)}×${Math.round(height)}px)`);
        } else {
          toast.success("บันทึกไฟล์ SVG สำเร็จ");
        }
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ SVG");
      }
    } catch (error) {
      console.error('Error saving SVG:', error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ SVG");
    }
  };

  const saveAsPNGWithCustomName = async (fileName: string) => {
    try {
      const reactFlowWrapper = flowWrapper.current;
      const reactFlowElement = reactFlowWrapper?.querySelector('.react-flow') as HTMLElement;

      if (!reactFlowElement || nodes.length === 0) {
        toast.error("ไม่พบแผนผังสำหรับบันทึก");
        return;
      }

      const success = await exportToPng(reactFlowElement, nodes, edges, fileName);

      if (success) {
        const box = getBoundingBoxFromDiagram(nodes, edges);
        if (box) {
          const padding = 50;
          const width = box.xMax - box.xMin + padding * 2;
          const height = box.yMax - box.yMin + padding * 2;
          toast.success(`บันทึกไฟล์ PNG สำเร็จ (${Math.round(width)}×${Math.round(height)}px)`);
        } else {
          toast.success("บันทึกไฟล์ PNG สำเร็จ");
        }
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ PNG");
      }
    } catch (error) {
      console.error('Error saving PNG:', error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกไฟล์ PNG");
    }
  };



  // เพิ่มฟังก์ชันแสดงสถานะ auto-save
  const renderAutoSaveStatus = () => {
    return null; // ไม่แสดงสถานะ auto-save
  };

  useEffect(() => {
    const preventUnwantedActions = (event: Event) => {
      // Prevent text selection
      if (event.type === 'selectstart') {
        const target = event.target as HTMLElement;
        if (!target.closest('input') && !target.closest('textarea') && !target.closest('[contenteditable="true"]')) {
          event.preventDefault();
          return false;
        }
      }
      // Prevent drag and drop on non-interactive elements
      if (event.type === 'dragstart') {
        const target = event.target as HTMLElement;
        if (!target.closest('.react-flow__node') &&
          !target.closest('[draggable="true"]') &&
          !target.closest('input') &&
          !target.closest('textarea')) {
          event.preventDefault();
          return false;
        }
      }
      // Prevent context menu on right click
      if (event.type === 'contextmenu') {
        const target = event.target as HTMLElement;
        if (!target.closest('input') &&
          !target.closest('textarea') &&
          !target.closest('[contenteditable="true"]')) {
          event.preventDefault();
          return false;
        }
      }
    };
    document.addEventListener('selectstart', preventUnwantedActions);
    document.addEventListener('dragstart', preventUnwantedActions);
    document.addEventListener('contextmenu', preventUnwantedActions);
    return () => {
      document.removeEventListener('selectstart', preventUnwantedActions);
      document.removeEventListener('dragstart', preventUnwantedActions);
      document.removeEventListener('contextmenu', preventUnwantedActions);
    };
  }, []);

  return (
    <div className="h-screen w-full flex">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div className="flex-1 flex flex-col">
        <div className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          {/* ซ้าย: Project Name + กลุ่มปุ่ม */}
          <div className="flex flex-col gap-1">
            {/* Project Name ... */}
            {isEditingProjectName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={projectNameInputRef}
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={handleProjectNameSave}
                  onKeyDown={handleProjectNameKeyDown}
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
                  onClick={handleProjectNameEdit}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title="แก้ไขชื่อโปรเจกต์"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {/* Project Management Actions */}
            <TooltipProvider>
              <div className="flex items-center gap-2">
                {/* Undo/Redo/Clear group */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleUndo} variant="ghost" size="sm" className="hover:bg-yellow-50" disabled={undoStack.length === 0}>
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
                    <Button onClick={handleRedo} variant="ghost" size="sm" className="hover:bg-yellow-50" disabled={redoStack.length === 0}>
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
                    <Button onClick={() => setClearDiagramModalOpen(true)} variant="ghost" size="sm" className="hover:bg-yellow-50">
                      ล้าง
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">ล้างแผนผัง</TooltipContent>
                </Tooltip>
                <Separator orientation="vertical" className="h-8 mx-2" />
                {/* Copy/Paste group */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleCopy} variant="ghost" size="sm" className="hover:bg-purple-50">
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
                    <Button onClick={handlePaste} variant="ghost" size="sm" className="hover:bg-purple-50">
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
                    <Button onClick={handleSaveProject} variant="ghost" size="sm" className="hover:bg-blue-50" >
                      <Save className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">บันทึก</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">บันทึกโปรเจกต์</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => setProjectSelectionOpen(true)} variant="ghost" size="sm" className="hover:bg-blue-50" >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">เปิด</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">เปิดโปรเจกต์</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleImport} variant="ghost" size="sm" className="hover:bg-blue-50" >
                      <Download className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">นำเข้า</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">นำเข้า JSON</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleNewProject} variant="ghost" size="sm" className="hover:bg-blue-50" >
                      <Plus className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">สร้างใหม่</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">สร้างโปรเจกต์ใหม่</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleDeleteProject} variant="ghost" size="sm" className="hover:bg-blue-50" >
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
                    <DropdownMenuItem onClick={() => handleExportFormat('json')}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportFormat('svg')}>SVG</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportFormat('png')}>PNG</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Close Project group (อยู่ถัดจาก Export) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setCloseModalOpen(true)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-100"
                    >
                      <LogOut className="w-4 h-4 mr-1 text-red-600" />
                      <span className="hidden sm:inline">ปิด</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">บันทึกและปิดโปรเจกต์</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            {renderAutoSaveStatus()}
          </div>
          {/* ขวาสุด: Logout */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setLogoutModalOpen(true)}
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

        <div className="flex-1 flex">
          <DeviceToolsBar
            isConnectionMode={isConnectionMode}
            onToggleConnectionMode={toggleConnectionMode}
            selectedSourceNode={selectedSourceNode}
          />

          <div className="flex-1 relative">
            <div
              ref={flowWrapper}
              style={{ width: '100%', height: '100%' }}
              onMouseDown={() => { }}
              onMouseUp={() => { }}
            >
              <ReactFlow
                {...reactFlowProps}
                onNodeDragStop={handleNodeDragStop}
              >
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panels */}
      {showProperties && selectedNode && (
        <PropertiesPanel
          selectedNode={selectedNode}
          onClose={() => setShowProperties(false)}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={(nodeId) => {
            onNodesChange([{ id: nodeId, type: 'remove' }]);
            setShowProperties(false);
            toast.success('ลบอุปกรณ์สำเร็จ');
          }}
        />
      )}

      {showEdgeProperties && selectedEdge && tempEdgeData && (
        <EdgePropertiesPanel
          selectedEdge={selectedEdge}
          tempEdgeData={tempEdgeData}
          onSave={handleSaveEdge}
          onCancel={handleCancelEdge}
          onUpdateTempData={setTempEdgeData}
          onDeleteEdge={(edgeId) => {
            onEdgesChange([{ id: edgeId, type: 'remove' }]);
            setShowEdgeProperties(false);
            // Edge removed, properties panel will close automatically
            toast.success('ลบสายสำเร็จ');
          }}
        />
      )}
      {!aiPanelOpen && !showProperties && !showEdgeProperties && (
        <AIEntryIcon onClick={() => setAIPanelOpen(true)} />
      )}
      <AIPanel
        open={aiPanelOpen}
        onClose={() => setAIPanelOpen(false)}
        nodes={nodes}
        edges={edges}
        currentProject={currentProject}
      />



      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
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
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ชื่อไฟล์"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">รูปแบบไฟล์</Label>
              <RadioGroup
                value={exportType}
                onValueChange={(value: 'json' | 'png' | 'svg') => setExportType(value)}
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
              <Button
                variant="outline"
                onClick={() => setExportModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleExportConfirm}
                disabled={!exportFileName.trim()}
              >
                ส่งออก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Selection Modal */}
      <ProjectSelectionModal
        open={projectSelectionOpen}
        onClose={() => setProjectSelectionOpen(false)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModalOpen(false)}
        onConfirm={handleConfirmDeleteProject}
        projectName={currentProject?.name || ''}
      />

      {/* Close Project Modal */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการปิดโปรเจกต์</DialogTitle>
            <DialogDescription>
              จะทำการบันทึกโปรเจกต์นี้แล้วปิด คุณต้องการดำเนินการต่อหรือไม่?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-gray-700">
            จะทำการบันทึกโปรเจกต์นี้แล้วปิด<br />
            คุณต้องการดำเนินการต่อหรือไม่?
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCloseModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (currentProject) {
                  try {
                    const diagramData = JSON.stringify({ nodes, edges });
                    await updateProject(currentProject.id, {
                      name: projectName,
                      diagram_data: diagramData
                    });
                    toast.success('บันทึกโปรเจกต์สำเร็จ');
                  } catch (error) {
                    console.error('Error saving project:', error);
                    toast.error('ไม่สามารถบันทึกโปรเจกต์ได้');
                  }
                }
                clearCurrentProject();

                // อัปเดต URL กลับไปหน้า dashboard
                window.history.pushState({}, '', '/');

                setCloseModalOpen(false);
              }}
            >
              บันทึกและปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Modal */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการออกจากระบบ</DialogTitle>
            <DialogDescription>
              คุณต้องการออกจากระบบหรือไม่? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              คุณต้องการออกจากระบบหรือไม่? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setLogoutModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                onClick={() => {
                  setLogoutModalOpen(false);
                  logout();
                }}
                variant="destructive"
              >
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Diagram Confirmation Modal */}
      <Dialog open={clearDiagramModalOpen} onOpenChange={setClearDiagramModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการล้างแผนผัง</DialogTitle>
            <DialogDescription>
              คุณต้องการล้างแผนผังนี้หรือไม่? การเปลี่ยนแปลงทั้งหมดจะหายไป
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              คุณต้องการล้างแผนผังนี้หรือไม่? การเปลี่ยนแปลงทั้งหมดจะหายไป
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setClearDiagramModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                onClick={() => {
                  setClearDiagramModalOpen(false);
                  clearDiagram();
                }}
                variant="destructive"
              >
                ล้างแผนผัง
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

const Index: React.FC = () => {
  const [projectSelectionOpen, setProjectSelectionOpen] = React.useState(false);

  return (
    <>
      <TooltipProvider>
        <ReactFlowProvider>
          <NetworkDiagramFlow
            projectSelectionOpen={projectSelectionOpen}
            setProjectSelectionOpen={setProjectSelectionOpen}
          />
        </ReactFlowProvider>
      </TooltipProvider>
    </>
  );
};

export default Index;
