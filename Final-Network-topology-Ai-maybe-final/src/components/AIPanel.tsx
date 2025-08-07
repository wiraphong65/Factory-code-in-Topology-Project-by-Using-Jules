import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI, analysisHistoryAPI } from '@/services/api';
import AnalysisResultModal from './AnalysisResultModal';
import { toast } from 'sonner';
import type { Node, Edge } from '@xyflow/react';

interface Project {
  id: number;
  name: string;
  description?: string;
  diagram_data?: string;
  analysis_count: number;
  last_analysis_at?: string;
  owner_id: number;
  created_at: string;
  updated_at?: string;
}

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  currentProject?: Project | null;
}

const AIPanel: React.FC<AIPanelProps> = ({
  open,
  onClose,
  nodes,
  edges,
  currentProject,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [aiHealth, setAiHealth] = useState<boolean | null>(null);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [modelLoading, setModelLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // AbortController สำหรับยกเลิกการ request
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [analysisStartTime, setAnalysisStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Background analysis tracking
  const [backgroundAnalysisToastId, setBackgroundAnalysisToastId] = useState<string | number | null>(null);

  // Floating notification state
  const [showFloatingNotification, setShowFloatingNotification] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState({ x: window.innerWidth - 280, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Tab system
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');

  // History system
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Delete confirmation modal
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Clear all history modal
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);

  // Result modal
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);

  // Enhanced project context change handling
  const [previousProjectId, setPreviousProjectId] = useState<number | null>(null);

  // Timer สำหรับแสดงเวลาที่ผ่านไป
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && analysisStartTime && backgroundAnalysisToastId) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - analysisStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);

        // Update background toast with elapsed time
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeText = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;

        // Update is handled by the floating component state
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, analysisStartTime, backgroundAnalysisToastId, currentProject]);

  // ตรวจสอบ AI health และดึงรายการ models เมื่อเปิด panel
  useEffect(() => {
    if (open) {
      checkAIHealth();
      loadAvailableModels();
      if (activeTab === 'history') {
        loadAnalysisHistory();
      }
    }
  }, [open, activeTab]);

  // Watch for project changes and reload history
  useEffect(() => {
    if (open && activeTab === 'history') {
      loadAnalysisHistory();
    }
  }, [currentProject]);

  // Clear history when no project is selected
  useEffect(() => {
    if (!currentProject) {
      setAnalysisHistory([]);
      setDeleteConfirmModalOpen(false);
      setItemToDelete(null);
    }
  }, [currentProject]);

  // Enhanced project context change handling
  useEffect(() => {
    const currentProjectId = currentProject?.id || null;

    if (previousProjectId !== currentProjectId) {
      if (previousProjectId !== null && currentProjectId !== previousProjectId) {
        setResult(null);
      }

      if (loading && abortController) {
        abortController.abort();
        setLoading(false);
        setAbortController(null);
        setAnalysisStartTime(null);
        setElapsedTime(0);
        toast.info('การวิเคราะห์ถูกยกเลิกเนื่องจากเปลี่ยนโปรเจกต์');
      }

      setPreviousProjectId(currentProjectId);
    }
  }, [currentProject, previousProjectId, loading, abortController]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Don't close if clicking inside the dropdown
      if (dropdownOpen && !target.closest('[data-dropdown]')) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkAIHealth = async () => {
    try {
      const response = await aiAPI.checkHealth();
      setAiHealth(response.data.ollama_connected);
      setCurrentModel(response.data.model || '');
    } catch (error) {
      setAiHealth(false);
      console.error('AI health check failed:', error);
    }
  };

  const loadAvailableModels = async () => {
    setModelLoading(true);
    try {
      const response = await aiAPI.getModels();
      const models = response.data.models || [];
      const currentModelFromAPI = response.data.current_model || '';

      setAvailableModels(models);
      setCurrentModel(currentModelFromAPI);
    } catch (error) {
      console.error('Failed to load models:', error);
      setAvailableModels([]);
    }
    setModelLoading(false);
  };

  const handleModelChange = async (model: string) => {
    try {
      // Try to set model via API if available
      if (aiAPI.setModel) {
        await aiAPI.setModel({ model });
        setCurrentModel(model);
        toast.success(`เปลี่ยนโมเดล AI เป็น ${model} แล้ว`);
      } else {
        // Fallback if API method doesn't exist
        setCurrentModel(model);
        toast.success(`เปลี่ยนโมเดล AI เป็น ${model} แล้ว`);
      }
    } catch (error: any) {
      // Check if it's a validation error (422)
      if (error.response?.status === 422) {
        const errorDetail = error.response?.data?.detail || 'Model ไม่ถูกต้อง';
        toast.error(`ไม่สามารถเปลี่ยนโมเดลได้: ${errorDetail}`);
      } else if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.detail || 'ข้อมูล Model ไม่ถูกต้อง';
        toast.error(`ไม่สามารถเปลี่ยนโมเดลได้: ${errorDetail}`);
      } else {
        // For other errors, still update local state
        setCurrentModel(model);
        toast.warning(`เปลี่ยนโมเดลเป็น ${model} แล้ว (อาจไม่สามารถบันทึกการตั้งค่าได้)`);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!currentProject) {
      toast.error('กรุณาเลือกโปรเจกต์ก่อนทำการวิเคราะห์');
      return;
    }

    setLoading(true);
    setResult(null);
    const startTime = new Date();
    setAnalysisStartTime(startTime);

    const controller = new AbortController();
    setAbortController(controller);

    // Show floating notification
    setShowFloatingNotification(true);
    setBackgroundAnalysisToastId('floating');

    try {
      const response = await aiAPI.analyze({
        nodes,
        edges,
        project_id: currentProject.id,
        model: currentModel
      }, controller.signal);

      if (controller.signal.aborted) {
        // Hide floating notification for cancellation
        setShowFloatingNotification(false);
        return;
      }

      setResult(response.data.analysis);

      // Calculate analysis duration
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationText = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')} นาที` : `${seconds} วินาที`;

      // Hide floating notification and show success toast
      setShowFloatingNotification(false);
      toast.success(`วิเคราะห์เสร็จสิ้น (${durationText}) - ${currentProject.name}`, {
        position: 'bottom-right',
        duration: 5000,
      });

      if (activeTab === 'history') {
        setTimeout(() => {
          loadAnalysisHistory();
        }, 1000);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        setShowFloatingNotification(false);
        return;
      }

      console.error('AI analysis failed:', error);
      const errorMessage = error.response?.data?.detail || 'เกิดข้อผิดพลาดในการขอคำตอบจาก AI';
      setResult(errorMessage);

      // Calculate analysis duration for error case
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationText = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')} นาที` : `${seconds} วินาที`;

      // Hide floating notification and show error toast
      setShowFloatingNotification(false);
      toast.error(`วิเคราะห์ล้มเหลว (${durationText}) - ${currentProject.name}`, {
        position: 'bottom-right',
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setAbortController(null);
      setAnalysisStartTime(null);
      setElapsedTime(0);
      setBackgroundAnalysisToastId(null);
    }
  };

  const formatLastUpdate = () => {
    if (!currentProject?.last_analysis_at) return '';

    const lastUpdate = new Date(currentProject.last_analysis_at);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'เมื่อสักครู่';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;

    return lastUpdate.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const loadAnalysisHistory = async () => {
    if (!currentProject) {
      setAnalysisHistory([]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    try {
      const params = {
        limit: 50,
        project_id: currentProject.id
      };

      const response = await analysisHistoryAPI.getHistory(params);
      setAnalysisHistory(response.data || []);
    } catch (error: any) {
      console.error('Error loading project history:', error);
      setAnalysisHistory([]);
      toast.error(`เกิดข้อผิดพลาดในการโหลดประวัติโปรเจกต์ "${currentProject.name}"`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteHistoryItem = (item: any) => {
    setItemToDelete(item);
    setDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !currentProject) return;

    setDeletingId(itemToDelete.id);
    try {
      await analysisHistoryAPI.deleteById(itemToDelete.id);
      setAnalysisHistory(prev => prev.filter(item => item.id !== itemToDelete.id));
      toast.success(`ลบประวัติการวิเคราะห์จากโปรเจกต์ "${currentProject.name}" เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error deleting history item:', error);
      toast.error('เกิดข้อผิดพลาดในการลบประวัติ');
    } finally {
      setDeletingId(null);
      setDeleteConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmModalOpen(false);
    setItemToDelete(null);
  };

  const handleClearAllHistory = async () => {
    if (!currentProject) return;

    try {
      // ลบประวัติทั้งหมดของโปรเจกต์นี้
      for (const item of analysisHistory) {
        await analysisHistoryAPI.deleteById(item.id);
      }

      setAnalysisHistory([]);
      setClearAllModalOpen(false);
      toast.success(`ลบประวัติการวิเคราะห์ทั้งหมดจากโปรเจกต์ "${currentProject.name}" เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error clearing all history:', error);
      toast.error('เกิดข้อผิดพลาดในการลบประวัติทั้งหมด');
    }
  };

  const handleCancelClearAll = () => {
    setClearAllModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDeviceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'pc': 'PC',
      'server': 'Server',
      'firewall': 'Firewall',
      'router': 'Router',
      'switch': 'Switch',
      'unknown': 'ไม่ระบุ'
    };
    return labels[type] || type;
  };

  const getDeviceTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'pc': 'bg-blue-500',
      'server': 'bg-green-500',
      'firewall': 'bg-red-500',
      'router': 'bg-purple-500',
      'switch': 'bg-yellow-500',
      'unknown': 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const handleClose = () => {
    onClose();
  };

  // Floating notification drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 260, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
      setFloatingPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Floating Analysis Notification */}
      <AnimatePresence key="floating-notification">
        {showFloatingNotification && (
          <motion.div
            key="floating-notification-content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[60] bg-white border border-gray-200 rounded-xl shadow-xl p-3 cursor-move select-none"
            style={{
              left: floatingPosition.x,
              top: floatingPosition.y,
              width: '260px'
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  วิเคราะห์ {elapsedTime > 0 ? `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}` : '0s'}
                </div>
                <div className="text-xs text-gray-500">{currentProject?.name}</div>
              </div>
              <button
                onClick={() => setShowFloatingNotification(false)}
                className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full transition-all duration-1000" style={{ width: `${Math.min((elapsedTime / 300) * 100, 100)}%` }}></div>
              </div>
              <span className="text-xs text-gray-400">
                {elapsedTime > 0 ? `${elapsedTime}s` : '0s'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence key="ai-panel-main">
        {open && (
          <motion.div
            key="ai-panel-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              key="ai-panel-backdrop"
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleClose}
              aria-hidden="true"
            />
            <motion.div
              key="ai-panel-content"
              className="relative w-full max-w-4xl h-[90vh] bg-white border border-gray-200 shadow-xl rounded-2xl flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.18 }}
              role="dialog"
              aria-modal="true"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClose();
                }
              }}
              tabIndex={-1}
            >
              {/* Header with tabs */}
              <div className="flex flex-col border-b border-gray-200 rounded-t-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <img src="/src/img/menu-tools/icons8-ai-48.png" alt="AI Icon" width={20} height={20} className="object-contain" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                      <p className="text-sm text-gray-500">Network Analysis & Optimization</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-6 bg-white">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analysis'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    วิเคราะห์
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    ประวัติ
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-white">
                {activeTab === 'analysis' ? (
                  <div className="flex flex-col h-full">
                    {/* Project Status Banner */}
                    {!currentProject ? (
                      <div className="mx-6 mt-6 mb-4">
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-orange-800 mb-1">ไม่มีโปรเจกต์ที่เลือก</h4>
                              <p className="text-sm text-orange-700">กรุณาเลือกโปรเจกต์ก่อนเพื่อเริ่มการวิเคราะห์ AI</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mx-6 mt-6 mb-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-blue-800">{currentProject.name}</h4>
                                <div className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-medium rounded-md">
                                  ID: #{currentProject.id}
                                </div>
                              </div>
                              <p className="text-sm text-blue-700 mb-2">
                                {currentProject.description || 'พร้อมสำหรับการวิเคราะห์ AI'}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-blue-600">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  <span>การวิเคราะห์: {currentProject.analysis_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>สร้างเมื่อ: {new Date(currentProject.created_at).toLocaleDateString('th-TH')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Analysis Content Area */}
                    <div className="flex-1 mx-6 mb-6">
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col">
                        {/* Content Header */}
                        <div className="px-6 py-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">AI Network Analysis</h3>
                                <p className="text-sm text-gray-500">วิเคราะห์แผนผังเครือข่ายด้วย AI</p>
                              </div>
                            </div>
                            {result && (
                              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>วิเคราะห์เสร็จสิ้น</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 p-6">
                          {!result && !loading && (
                            <div key="empty-state" className="h-full flex flex-col items-center justify-center text-center">
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </div>
                              <h4 className="text-xl font-semibold text-gray-800 mb-3">
                                {currentProject ? 'พร้อมสำหรับการวิเคราะห์' : 'เลือกโปรเจกต์เพื่อเริ่มต้น'}
                              </h4>
                              <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
                                {currentProject
                                  ? `AI จะวิเคราะห์โครงสร้างเครือข่าย ประสิทธิภาพ และความปลอดภัยของโปรเจกต์ "${currentProject.name}" ให้คุณ`
                                  : 'เลือกโปรเจกต์จากเมนูด้านบนเพื่อเริ่มการวิเคราะห์ด้วย AI'
                                }
                              </p>
                              {currentProject && (
                                <div key="feature-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
                                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                      </svg>
                                    </div>
                                    <h5 className="font-medium text-blue-800 text-sm mb-1">โครงสร้าง</h5>
                                    <p className="text-xs text-blue-600">วิเคราะห์โครงสร้างเครือข่าย</p>
                                  </div>
                                  <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                    </div>
                                    <h5 className="font-medium text-green-800 text-sm mb-1">ประสิทธิภาพ</h5>
                                    <p className="text-xs text-green-600">ตรวจสอบประสิทธิภาพ</p>
                                  </div>
                                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                      </svg>
                                    </div>
                                    <h5 className="font-medium text-purple-800 text-sm mb-1">ความปลอดภัย</h5>
                                    <p className="text-xs text-purple-600">ตรวจสอบความปลอดภัย</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {loading && (
                            <div key="loading-state" className="h-full flex flex-col items-center justify-center text-center">
                              <div className="relative mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                                  <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                                </div>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-800 mb-2">กำลังวิเคราะห์...</h4>
                              <p className="text-gray-600 mb-4">AI กำลังวิเคราะห์แผนผังเครือข่ายของคุณ</p>
                              {elapsedTime > 0 && (
                                <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>เวลาที่ผ่านไป: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')} นาที</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {result && !loading && (
                            <div key="result-state" className="h-full">
                              <div className="bg-gray-50 rounded-xl p-6 h-full overflow-y-auto">
                                <div className="prose prose-sm max-w-none">
                                  <div className="whitespace-pre-line text-gray-800 leading-relaxed">
                                    {result}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">ประวัติการวิเคราะห์</h3>
                          {currentProject && (
                            <div key="project-badge" className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-xl">
                              {currentProject.name}
                            </div>
                          )}
                        </div>
                        {currentProject && analysisHistory.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClearAllModalOpen(true)}
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            ลบทั้งหมด
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {!currentProject
                          ? 'เลือกโปรเจกต์เพื่อดูประวัติการวิเคราะห์ที่เฉพาะเจาะจง'
                          : analysisHistory.length > 0
                            ? `มีประวัติการวิเคราะห์ ${analysisHistory.length} รายการ • อัปเดตล่าสุด ${formatLastUpdate()}`
                            : 'ยังไม่มีประวัติการวิเคราะห์ในโปรเจกต์นี้'
                        }
                      </p>
                      {currentProject && (
                        <div key="project-stats" className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>โปรเจกต์ ID: #{currentProject.id}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>การวิเคราะห์ทั้งหมด: {currentProject.analysis_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 002 2h6a2 2 0 002-2v-4a2 2 0 00-2-2H10a2 2 0 00-2 2z" />
                            </svg>
                            <span>สร้างเมื่อ: {new Date(currentProject.created_at).toLocaleDateString('th-TH')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {historyLoading ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                        </div>
                        <h4 className="text-base font-medium text-gray-700 mb-2">กำลังโหลดประวัติ</h4>
                        <p className="text-sm text-gray-500">
                          {currentProject
                            ? `กำลังโหลดประวัติของโปรเจกต์ "${currentProject.name}"...`
                            : 'กำลังโหลดประวัติ...'
                          }
                        </p>
                      </div>
                    ) : !currentProject ? (
                      <div className="text-center py-16 text-gray-500">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h4 className="text-base font-medium text-gray-700 mb-2">ไม่มีโปรเจกต์ที่เลือก</h4>
                        <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                          เลือกโปรเจกต์เพื่อดูประวัติการวิเคราะห์ AI ที่เฉพาะเจาะจงกับโปรเจกต์นั้นๆ
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>เลือกหรือสร้างโปรเจกต์เพื่อเริ่มต้น</span>
                        </div>
                      </div>
                    ) : analysisHistory.length === 0 ? (
                      <div className="text-center py-16 text-gray-500">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-base font-medium text-gray-700 mb-2">
                          โปรเจกต์ "{currentProject?.name}" ยังไม่มีประวัติการวิเคราะห์
                        </h4>
                        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                          เริ่มวิเคราะห์แผนผังเครือข่ายในแท็บ "วิเคราะห์" เพื่อสร้างประวัติการวิเคราะห์แรกของโปรเจกต์นี้
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => setActiveTab('analysis')}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>ไปที่แท็บวิเคราะห์</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysisHistory.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="font-medium text-gray-900">
                                      การวิเคราะห์เครือข่าย
                                    </div>
                                    {currentProject && (
                                      <div className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-md">
                                        {currentProject.name}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatDate(item.created_at)}
                                  </div>
                                  {currentProject?.description && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      โปรเจกต์: {currentProject.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.device_count} อุปกรณ์
                                </div>
                                <div className="text-xs text-blue-600">
                                  {item.model_used}
                                </div>
                                {item.execution_time_seconds && (
                                  <div className="text-xs text-gray-400">
                                    {Math.floor(item.execution_time_seconds / 60)}:{(item.execution_time_seconds % 60).toString().padStart(2, '0')}
                                  </div>
                                )}
                                {currentProject && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    ID: #{currentProject.id}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Device Types Summary */}
                            {item.device_types && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {Object.entries(JSON.parse(item.device_types || '{}')).map(([type, count]) => (
                                  <div key={type} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-xl">
                                    <div className={`w-2 h-2 rounded-full ${getDeviceTypeColor(type)}`}></div>
                                    <span>{getDeviceTypeLabel(type)}: {String(count)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Preview */}
                            <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.analysis_result.substring(0, 150)}...
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedResult(item.analysis_result);
                                    setSelectedMetadata({
                                      created_at: item.created_at,
                                      model_used: item.model_used,
                                      device_count: item.device_count,
                                      execution_time_seconds: item.execution_time_seconds,
                                      project_name: currentProject?.name,
                                      project_id: currentProject?.id,
                                      project_description: currentProject?.description
                                    });
                                    setResultModalOpen(true);
                                  }}
                                  className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  ดู
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteHistoryItem(item)}
                                disabled={deletingId === item.id}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                {deletingId === item.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent mr-1" />
                                ) : (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                                ลบ
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Footer - Analysis tab only */}
              {activeTab === 'analysis' && (
                <div className="flex flex-col  border-gray-200 rounded-t-2xl ">
                  <div className="px-6 py-5">
                    {/* Model Selector */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-md flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-800">
                          เลือกโมเดล AI
                        </label>
                      </div>
                      <div className="relative" data-dropdown>
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          disabled={modelLoading || aiHealth === false || !isOnline || loading}
                          className="w-full px-4 py-3 text-left bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="block truncate">
                              {modelLoading ? 'กำลังโหลดโมเดล...' :
                                currentModel || 'เลือกโมเดล AI'}
                            </span>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" />
                            </svg>
                          </div>
                        </button>

                        {dropdownOpen && (
                          <div className="absolute z-20 w-full bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                            {availableModels.length > 0 ? (
                              <React.Fragment key="model-list">
                                {availableModels.map((model) => (
                                  <button
                                    key={model}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleModelChange(model);
                                      setDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors ${currentModel === model ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' : 'text-gray-700'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${currentModel === model ? 'bg-blue-500' : 'bg-gray-300'
                                          }`} />
                                        <span className="block truncate font-medium">{model}</span>
                                      </div>
                                      {currentModel === model && (
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </React.Fragment>
                            ) : (
                              <div key="no-models" className="px-4 py-3 text-sm text-gray-500 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <span>ไม่พบโมเดล AI</span>
                                </div>
                                <p className="text-xs">กรุณาตรวจสอบการเชื่อมต่อ</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* AI Health Status */}
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-orange-500' :
                          aiHealth === null ? 'bg-gray-400' :
                            aiHealth ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        <span className={`${!isOnline ? 'text-orange-600' :
                          aiHealth === null ? 'text-gray-500' :
                            aiHealth ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {!isOnline ? 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต' :
                            aiHealth === null ? 'กำลังตรวจสอบ...' :
                              aiHealth ? 'AI พร้อมใช้งาน' : 'AI ไม่พร้อมใช้งาน'}
                        </span>
                        {currentModel && aiHealth && isOnline && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">โมเดลปัจจุบัน: {currentModel}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        className="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        onClick={handleAnalyze}
                        disabled={loading || aiHealth === false || !currentProject || !isOnline}
                      >
                        วิเคราะห์
                      </Button>
                      {loading ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (abortController) {
                              abortController.abort();
                              setAbortController(null);
                              setLoading(false);
                              setAnalysisStartTime(null);
                              setElapsedTime(0);

                            }
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            หยุดการวิเคราะห์
                          </div>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setResult(null)}
                          disabled={!result || loading}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          ล้างคำตอบ
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        <AnalysisResultModal
          key="analysis-result-modal"
          open={resultModalOpen}
          onClose={() => setResultModalOpen(false)}
          result={selectedResult}
          metadata={selectedMetadata}
        />

        {/* Delete Confirmation Modal */}
        <AnimatePresence key="delete-confirmation-modal">
          {deleteConfirmModalOpen && (
            <motion.div
              key="delete-modal-overlay"
              className="fixed inset-0 z-[70] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                key="delete-modal-backdrop"
                className="absolute inset-0 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={handleCancelDelete}
                aria-hidden="true"
              />
              <motion.div
                key="delete-modal-content"
                className="relative w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-xl flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                transition={{ duration: 0.3, type: 'spring', bounce: 0.18 }}
                role="dialog"
                aria-modal="true"
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">ยืนยันการลบประวัติ</h3>
                    <p className="text-sm text-gray-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700 mb-4">
                    คุณแน่ใจหรือไม่ที่จะลบประวัติการวิเคราะห์นี้จากโปรเจกต์ "{currentProject?.name}"?
                  </p>
                  {itemToDelete && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">การวิเคราะห์เครือข่าย</span>
                            {currentProject && (
                              <div className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-md">
                                {currentProject.name}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {formatDate(itemToDelete.created_at)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>{itemToDelete.model_used}</span>
                            <span>•</span>
                            <span>{itemToDelete.device_count} อุปกรณ์</span>
                            {itemToDelete.execution_time_seconds && (
                              <>
                                <span>•</span>
                                <span>{Math.floor(itemToDelete.execution_time_seconds / 60)}:{(itemToDelete.execution_time_seconds % 60).toString().padStart(2, '0')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium mb-1">หมายเหตุ:</p>
                        <p>ประวัติที่ลบแล้วจะไม่สามารถกู้คืนได้ และจะส่งผลต่อสถิติการวิเคราะห์ของโปรเจกต์</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <Button
                    variant="outline"
                    onClick={handleCancelDelete}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    disabled={deletingId === itemToDelete?.id}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {deletingId === itemToDelete?.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        กำลังลบ...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        ลบประวัติ
                      </div>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear All History Confirmation Modal */}
        <AnimatePresence key="clear-all-confirmation-modal">
          {clearAllModalOpen && (
            <motion.div
              key="clear-all-modal-overlay"
              className="fixed inset-0 z-[60] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                key="clear-all-modal-backdrop"
                className="absolute inset-0 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCancelClearAll}
              />
              <motion.div
                key="clear-all-modal-content"
                className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">ลบประวัติทั้งหมด</h3>
                      <p className="text-sm text-gray-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700 mb-4">
                    คุณแน่ใจหรือไม่ที่จะลบประวัติการวิเคราะห์ทั้งหมด ({analysisHistory.length} รายการ) จากโปรเจกต์ "{currentProject?.name}"?
                  </p>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex gap-3">
                      <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-xs text-red-800">
                        <p className="font-medium mb-1">คำเตือน:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>ประวัติทั้งหมดจะถูกลบอย่างถาวร</li>
                          <li>ไม่สามารถกู้คืนข้อมูลได้</li>
                          <li>สถิติการวิเคราะห์ของโปรเจกต์จะถูกรีเซ็ต</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <Button
                    variant="outline"
                    onClick={handleCancelClearAll}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleClearAllHistory}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      ลบทั้งหมด ({analysisHistory.length} รายการ)
                    </div>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </>
  );
};

export default AIPanel;