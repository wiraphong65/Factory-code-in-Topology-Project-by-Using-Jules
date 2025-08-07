import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useProject } from '../contexts/ProjectContext';
import { useNetworkDiagram } from './useNetworkDiagram';

interface ProjectActionsProps {
  setCreateProjectModalOpen: (isOpen: boolean) => void;
  setDeleteProjectModalOpen: (isOpen: boolean) => void;
}

export const useProjectActions = ({
  setCreateProjectModalOpen,
  setDeleteProjectModalOpen,
}: ProjectActionsProps) => {
  const {
    currentProject,
    createProject,
    updateProject,
    deleteProject,
  } = useProject();

  const {
    nodes,
    edges,
    projectName,
    setProjectName,
    clearDiagram,
  } = useNetworkDiagram();

  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const projectNameInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProject = async () => {
    try {
      const diagramData = JSON.stringify({ nodes, edges });
      if (currentProject) {
        await updateProject(currentProject.id, {
          name: projectName,
          diagram_data: diagramData,
        });
        toast.success('บันทึกโปรเจกต์สำเร็จ');
      } else {
        await createProject({
          name: projectName,
          diagram_data: diagramData,
        });
        toast.success('สร้างและบันทึกโปรเจกต์ใหม่สำเร็จ');
      }
    } catch (e) {
      console.error('Save failed:', e);
      toast.error('บันทึกไม่สำเร็จ');
    }
  };

  const handleNewProject = () => {
    setCreateProjectModalOpen(true);
  };

  const handleCreateProject = async (newProjectName: string, description: string) => {
    try {
      clearDiagram();
      await createProject({
        name: newProjectName,
        description: description,
        diagram_data: JSON.stringify({ nodes: [], edges: [] }),
      });
      setProjectName(newProjectName);
      toast.success("สร้างโปรเจกต์ใหม่สำเร็จ และเปิดใช้งานแล้ว");
    } catch (e) {
      console.error('Error creating project:', e);
      toast.error("ไม่สามารถสร้างโปรเจกต์ใหม่ได้");
    }
  };

  const handleDeleteProject = () => {
    setDeleteProjectModalOpen(true);
  };

  const handleConfirmDeleteProject = async () => {
    if (currentProject) {
      try {
        await deleteProject(currentProject.id);
        clearDiagram();
        setProjectName('โปรเจกต์ใหม่');
        window.history.pushState({}, '', '/');
        toast.success("ลบโปรเจกต์ปัจจุบันสำเร็จ");
      } catch (e) {
        console.error("ไม่สามารถลบโปรเจกต์ได้", e)
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
      // Optionally revert name change on escape
    }
  };

  return {
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
  };
};
