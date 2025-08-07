import React, { createContext, useContext, useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import type { Project } from '../types/network';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  createProject: (data: { name: string; description?: string; diagram_data?: string }) => Promise<void>;
  loadProjects: () => Promise<void>;
  selectProject: (project: Project) => void;
  updateProject: (id: number, data: any) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  clearCurrentProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load projects when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('User authenticated, loading projects...');
      
      // ตรวจสอบว่าเป็นการ login ครั้งแรกหรือ refresh
      const savedProjectId = localStorage.getItem('currentProjectId');
      const isFirstLoad = localStorage.getItem('isFirstLoadAfterLogin');
      
      // ถ้าเป็นการ login ครั้งแรก (ไม่มี savedProjectId) ให้ตั้งค่า flag
      if (!savedProjectId && isFirstLoad !== 'false') {
        localStorage.setItem('isFirstLoadAfterLogin', 'true');
      } else {
        // ถ้ามี savedProjectId หรือเคย login แล้ว ให้ลบ flag
        localStorage.removeItem('isFirstLoadAfterLogin');
      }
      
      loadProjects();
    } else {
      // Clear projects when user logs out
      setProjects([]);
      setCurrentProject(null);
      // ลบ flag เมื่อ logout
      localStorage.removeItem('isFirstLoadAfterLogin');
      // ไม่ลบ localStorage.removeItem('currentProjectId'); เพื่อให้เก็บไว้สำหรับครั้งต่อไป
    }
  }, [user]);

  // Restore current project from localStorage after projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      const savedProjectId = localStorage.getItem('currentProjectId');
      const isFirstLoad = localStorage.getItem('isFirstLoadAfterLogin');
      console.log('Restore effect - savedProjectId:', savedProjectId, 'projects.length:', projects.length, 'isFirstLoad:', isFirstLoad);
      
      // ถ้าเป็นครั้งแรกที่ login ให้ไม่ restore project ทันที
      if (isFirstLoad === 'true') {
        console.log('First load after login, not restoring project');
        localStorage.removeItem('isFirstLoadAfterLogin');
        return;
      }
      
      // ถ้ามี savedProjectId ให้ restore project ทันที (รวมถึงตอน refresh)
      if (savedProjectId) {
        const project = projects.find(p => p.id.toString() === savedProjectId);
        if (project) {
          console.log('Restoring project:', project.id, project.name);
          setCurrentProject(project);
        } else {
          // ถ้าไม่พบโปรเจกต์ที่บันทึกไว้ ให้ลบออกจาก localStorage
          console.log('Saved project not found, clearing localStorage');
          localStorage.removeItem('currentProjectId');
        }
      }
    }
  }, [projects, currentProject]);

  const loadProjects = async () => {
    if (!user) {
      console.log('No user, skipping project load');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading projects for user:', user.id);
      console.log('Token available:', !!localStorage.getItem('token'));
      const response = await projectsAPI.getAll();
      console.log('Loaded projects:', response.data.length);
      console.log('Projects data:', response.data);
      setProjects(response.data);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (data: { name: string; description?: string; diagram_data?: string }) => {
    try {
      console.log('Creating project:', data.name);
      const response = await projectsAPI.create(data);
      const newProject = response.data;
      console.log('Created project:', newProject.id, newProject.name);
      
      setProjects(prev => [...prev, newProject]);
      setCurrentProject(newProject);
      localStorage.setItem('currentProjectId', newProject.id.toString());
      // ลบ flag เมื่อสร้าง project ใหม่
      localStorage.removeItem('isFirstLoadAfterLogin');
      localStorage.setItem('isFirstLoadAfterLogin', 'false');
      console.log('Set current project to:', newProject.id);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    localStorage.setItem('currentProjectId', project.id.toString());
    // ลบ flag เมื่อ user เลือก project เพื่อให้การ restore ทำงานปกติในครั้งต่อไป
    localStorage.removeItem('isFirstLoadAfterLogin');
    localStorage.setItem('isFirstLoadAfterLogin', 'false');
    
    // อัปเดต URL เพื่อให้สามารถ bookmark ได้
    window.history.pushState({}, '', '/diagram');
  };

  const updateProject = async (id: number, data: any) => {
    try {
      const response = await projectsAPI.update(id, data);
      setProjects(prev => prev.map(p => p.id === id ? response.data : p));
      if (currentProject?.id === id) {
        setCurrentProject(response.data);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
        localStorage.removeItem('currentProjectId');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  };

  const clearCurrentProject = () => {
    setCurrentProject(null);
    localStorage.removeItem('currentProjectId');
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      loading,
      createProject,
      loadProjects,
      selectProject,
      updateProject,
      deleteProject,
      clearCurrentProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}; 