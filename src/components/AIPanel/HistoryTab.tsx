import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Archive,
  AlertCircle,
  X,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Project, AnalysisHistoryItem } from '@/types/ai-panel';
import { formatDate } from '@/utils/ai-panel-utils';

interface HistoryTabProps {
  currentProject: Project | null | undefined;
  historyState: any;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  currentProject,
  historyState
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredHistory = historyState.analysisHistory.filter((item: AnalysisHistoryItem) =>
    (item.analysis_result?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.model_used?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleViewResult = (item: AnalysisHistoryItem) => {
    setSelectedResult(item.analysis_result || '');
    setSelectedMetadata({
      model: item.model_used || 'Unknown',
      device_count: item.device_count || 0,
      created_at: item.created_at || new Date().toISOString(),
      project_name: currentProject?.name || 'Unknown Project'
    });
    setResultModalOpen(true);
    setCopied(false); // Reset copy state
  };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(selectedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // No project selected
  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Archive className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ไม่ได้เลือกโปรเจกต์
          </h3>
          <p className="text-gray-600">
            กรุณาเลือกโปรเจกต์เพื่อดูประวัติการวิเคราะห์
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              ประวัติการวิเคราะห์
            </h3>
            <p className="text-sm text-gray-600">
              {currentProject.name} • {filteredHistory.length} การวิเคราะห์
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={historyState.loadAnalysisHistory}
              disabled={historyState.historyLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${historyState.historyLoading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>

            {filteredHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => historyState.setClearAllModalOpen(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ลบทั้งหมด
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ค้นหาการวิเคราะห์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {historyState.historyLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
              <p className="text-gray-600">กำลังโหลดประวัติ...</p>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'ไม่พบผลลัพธ์' : 'ไม่มีประวัติการวิเคราะห์'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? `ไม่พบการวิเคราะห์ที่ตรงกับ "${searchQuery}"`
                  : `ยังไม่มีการวิเคราะห์สำหรับ "${currentProject.name}"`
                }
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  ล้างการค้นหา
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {filteredHistory.map((item: AnalysisHistoryItem, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="p-4 hover:shadow-sm transition-shadow border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.model_used || 'โมเดลไม่ทราบ'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.device_count || 0} อุปกรณ์
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(item.created_at || new Date().toISOString())}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                          {(item.analysis_result || 'ไม่มีเนื้อหาการวิเคราะห์').substring(0, 150)}
                          {(item.analysis_result || '').length > 150 && '...'}
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResult(item)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            ดู
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => historyState.handleDeleteHistoryItem(item)}
                            disabled={historyState.deletingId === item.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {historyState.deletingId === item.id ? 'กำลังลบ...' : 'ลบ'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {historyState.deleteConfirmModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={historyState.handleCancelDelete}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">ลบการวิเคราะห์</h3>
                  <p className="text-xs text-gray-600">จาก {currentProject.name}</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                ต้องการลบการวิเคราะห์นี้?
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={historyState.handleCancelDelete}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={historyState.handleConfirmDelete}
                  disabled={historyState.deletingId !== null}
                  className="flex-1"
                >
                  ลบ
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear All Modal */}
      <AnimatePresence>
        {historyState.clearAllModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={historyState.handleCancelClearAll}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">ลบประวัติทั้งหมด</h3>
                  <p className="text-xs text-gray-600">จาก {currentProject.name}</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                คุณแน่ใจหรือไม่ว่าต้องการลบการวิเคราะห์ทั้งหมด {historyState.analysisHistory.length} รายการ? การกระทำนี้ไม่สามารถยกเลิกได้
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={historyState.handleCancelClearAll}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={historyState.handleClearAllHistory}
                  className="flex-1"
                >
                  ลบทั้งหมด
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {resultModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setResultModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">ผลการวิเคราะห์</h3>
                    {selectedMetadata && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">โมเดล:</span>
                          <span>{selectedMetadata.model}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">อุปกรณ์:</span>
                          <span>{selectedMetadata.device_count} เครื่อง</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">วันที่:</span>
                          <span>{formatDate(selectedMetadata.created_at)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyResult}
                      className="h-8 px-3 bg-white/50 hover:bg-white border-white/50 hover:border-white"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-green-600" />
                          <span className="text-green-600">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResultModalOpen(false)}
                      className="h-8 w-8 p-0 hover:bg-white/50 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden rounded-b-2xl">
                <div className="h-full overflow-y-auto p-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-mono">
                      {selectedResult}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryTab;