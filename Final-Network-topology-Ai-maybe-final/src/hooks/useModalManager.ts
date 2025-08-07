import { useState } from 'react';

export const useModalManager = () => {
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [clearDiagramModalOpen, setClearDiagramModalOpen] = useState(false);

  return {
    aiPanelOpen,
    setAIPanelOpen,
    exportModalOpen,
    setExportModalOpen,
    createProjectModalOpen,
    setCreateProjectModalOpen,
    deleteProjectModalOpen,
    setDeleteProjectModalOpen,
    closeModalOpen,
    setCloseModalOpen,
    logoutModalOpen,
    setLogoutModalOpen,
    clearDiagramModalOpen,
    setClearDiagramModalOpen,
  };
};
