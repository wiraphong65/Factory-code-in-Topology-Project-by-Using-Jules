import React, { useRef, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { toast } from 'sonner';

// UI Components
import { DeviceToolsBar } from './DeviceToolsBar';
import { PropertiesPanel } from './PropertiesPanel';
import { EdgePropertiesPanel } from './EdgePropertiesPanel';
import AIEntryIcon from './ui/AIEntryIcon';
import AIPanel from './AIPanel';
import { ProjectSelectionModal } from './ProjectSelectionModal';
import { CreateProjectModal } from './ui/create-project-modal';
import { DeleteProjectModal } from './ui/delete-project-modal';

// Layout Components
import Header from './layout/Header';
import FlowCanvas from './layout/FlowCanvas';

// Modal Components
import ExportModal from './modals/ExportModal';
import { CloseProjectDialog, LogoutDialog, ClearDiagramDialog } from './modals/ConfirmationDialogs';

// Hooks
import { useNetworkDiagram } from '../hooks/useNetworkDiagram';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useModalManager } from '../hooks/useModalManager';
import { useProjectActions } from '../hooks/useProjectActions';
import { useDiagramIO } from '../hooks/useDiagramIO';
import { useKeyboardHandlers } from '../hooks/useKeyboardHandlers';
import { useAutoSave } from '../hooks/useAutoSave';

const NetworkDiagramFlow = React.memo(({ projectSelectionOpen, setProjectSelectionOpen }: { projectSelectionOpen: boolean, setProjectSelectionOpen: (open: boolean) => void }) => {
  const flowWrapper = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { currentProject, clearCurrentProject, updateProject } = useProject();

  const networkDiagram = useNetworkDiagram();
  const {
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
    toggleConnectionMode,
    handleNodeDragStop,
    setTempEdgeData,
    setShowProperties,
    setShowEdgeProperties,
    loadDiagramFromData,
    recoverFromBackup,
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
  } = networkDiagram;

  const {
    aiPanelOpen, setAIPanelOpen,
    exportModalOpen, setExportModalOpen,
    createProjectModalOpen, setCreateProjectModalOpen,
    deleteProjectModalOpen, setDeleteProjectModalOpen,
    closeModalOpen, setCloseModalOpen,
    logoutModalOpen, setLogoutModalOpen,
    clearDiagramModalOpen, setClearDiagramModalOpen,
  } = useModalManager();

  useAutoSave({ nodes, edges, currentProject, projectName });

  const {
    isEditingProjectName,
    projectNameInputRef,
    handleSaveProject,
    handleNewProject,
    handleCreateProject,
    handleDeleteProject,
    handleConfirmDeleteProject,
    handleProjectNameEdit,
    handleProjectNameSave,
    handleProjectNameKeyDown,
  } = useProjectActions({
    setCreateProjectModalOpen,
    setDeleteProjectModalOpen,
  });

  const {
    fileInputRef,
    exportType, setExportType,
    exportFileName, setExportFileName,
    handleImport,
    handleFileSelect,
    handleOpenExportModal,
    handleExportConfirm,
    handleExportFormat,
  } = useDiagramIO({
    flowWrapper,
    setExportModalOpen,
  });

  useKeyboardHandlers({
    handleSaveProject,
    handleOpenExportModal,
    handleCopy,
    handlePaste,
    handleUndo,
    handleRedo,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
  });

  // Effect to load diagram data when project changes
  useEffect(() => {
    if (currentProject?.diagram_data) {
      try {
        loadDiagramFromData(currentProject.diagram_data);
      } catch (error) {
        console.error('Error loading diagram data:', error);
        toast.error('ไม่สามารถโหลดข้อมูลแผนผังได้');
      }
    } else if (currentProject) {
      clearDiagram();
    }
  }, [currentProject, loadDiagramFromData, clearDiagram]);

  // Effect to handle backup recovery
  useEffect(() => {
    if (!currentProject && nodes.length === 0 && edges.length === 0) {
      if (recoverFromBackup()) {
        toast.info('พบข้อมูลที่ยังไม่ได้บันทึก ต้องการกู้คืนหรือไม่?');
      }
    }
  }, [currentProject, nodes.length, edges.length, recoverFromBackup]);

  const handleCloseProject = async () => {
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
      window.history.pushState({}, '', '/');
  };

  const headerToolbarProps = {
    onUndo: handleUndo,
    onRedo: handleRedo,
    onClear: () => setClearDiagramModalOpen(true),
    onCopy: handleCopy,
    onPaste: handlePaste,
    onSave: handleSaveProject,
    onOpen: () => setProjectSelectionOpen(true),
    onImport: handleImport,
    onNew: handleNewProject,
    onDelete: handleDeleteProject,
    onExport: handleExportFormat,
    onClose: () => setCloseModalOpen(true),
  };

  return (
    <div className="h-screen w-full flex">
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} />

      <div className="flex-1 flex flex-col">
        <Header
          isEditingProjectName={isEditingProjectName}
          projectNameInputRef={projectNameInputRef}
          onProjectNameKeyDown={handleProjectNameKeyDown}
          onProjectNameSave={handleProjectNameSave}
          onProjectNameEdit={handleProjectNameEdit}
          onLogout={() => setLogoutModalOpen(true)}
          toolbarProps={headerToolbarProps}
        />

        <div className="flex-1 flex">
          <DeviceToolsBar
            isConnectionMode={isConnectionMode}
            onToggleConnectionMode={toggleConnectionMode}
            selectedSourceNode={selectedSourceNode}
          />
          <div className="flex-1 relative" ref={flowWrapper}>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onNodeDrag={handleNodeDragStop}
            />
          </div>
        </div>
      </div>

      {/* Panels */}
      {showProperties && selectedNode && (
        <PropertiesPanel
          selectedNode={selectedNode}
          onClose={() => setShowProperties(false)}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={(nodeId) => {
            onNodesChange([{ id: nodeId, type: 'remove' }]);
            setShowProperties(false);
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

      {/* Modals */}
      <ProjectSelectionModal open={projectSelectionOpen} onClose={() => setProjectSelectionOpen(false)} />
      <CreateProjectModal isOpen={createProjectModalOpen} onClose={() => setCreateProjectModalOpen(false)} onSubmit={handleCreateProject} />
      <DeleteProjectModal isOpen={deleteProjectModalOpen} onClose={() => setDeleteProjectModalOpen(false)} onConfirm={handleConfirmDeleteProject} projectName={currentProject?.name || ''} />
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        fileName={exportFileName}
        setFileName={setExportFileName}
        exportType={exportType}
        setExportType={setExportType}
        onConfirm={handleExportConfirm}
      />
      <CloseProjectDialog isOpen={closeModalOpen} onClose={() => setCloseModalOpen(false)} onConfirm={handleCloseProject} />
      <LogoutDialog isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} onConfirm={logout} />
      <ClearDiagramDialog isOpen={clearDiagramModalOpen} onClose={() => setClearDiagramModalOpen(false)} onConfirm={clearDiagram} />
    </div>
  );
});

const MainLayout: React.FC = () => {
  const [projectSelectionOpen, setProjectSelectionOpen] = React.useState(false);

  return (
    <ReactFlowProvider>
      <NetworkDiagramFlow
        projectSelectionOpen={projectSelectionOpen}
        setProjectSelectionOpen={setProjectSelectionOpen}
      />
    </ReactFlowProvider>
  );
};

export default MainLayout;
