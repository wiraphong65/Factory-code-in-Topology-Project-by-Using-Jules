import { useState, useEffect, useRef, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useProject } from '../contexts/ProjectContext';
import type { Project } from '../types/network';

interface AutoSaveProps {
  nodes: Node[];
  edges: Edge[];
  currentProject: Project | null;
  projectName: string;
}

export const useAutoSave = ({ nodes, edges, currentProject, projectName }: AutoSaveProps) => {
  const { updateProject } = useProject();
  const [, setLastAutoSaved] = useState<Date | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const autoSave = useCallback(async () => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (isAutoSaving) return;
    if (!currentProject) return;

    setIsAutoSaving(true);
    try {
      const diagramData = JSON.stringify({ nodes, edges });
      await updateProject(currentProject.id, {
        name: projectName,
        diagram_data: diagramData
      });

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
  }, [nodes, edges, currentProject, projectName, updateProject, isAutoSaving]);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      autoSaveIntervalRef.current = setInterval(autoSave, 30000); // Auto-save every 30 seconds

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [nodes, edges, autoSave]);

  return { isAutoSaving };
};
