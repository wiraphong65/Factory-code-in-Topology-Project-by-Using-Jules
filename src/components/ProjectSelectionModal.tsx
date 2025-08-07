import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useProject } from '@/contexts/ProjectContext';
import { useNetworkDiagram } from '@/hooks/useNetworkDiagram';
import { LoadingSpinner } from './LoadingSpinner';

interface ProjectSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({
  open,
  onClose,
}) => {
  const { projects, selectProject, loading } = useProject();
  const { setProjectName, loadDiagramFromData } = useNetworkDiagram();

  const handleProjectSelect = (project: any) => {
    selectProject(project);
    setProjectName(project.name);
    
    // Load diagram data if exists
    if (project.diagram_data) {
      loadDiagramFromData(project.diagram_data);
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เลือกโปรเจกต์</DialogTitle>
          <DialogDescription>
            เลือกโปรเจกต์ที่ต้องการเปิด
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ไม่มีโปรเจกต์ใดๆ
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleProjectSelect(project)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription>{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      สร้างเมื่อ: {new Date(project.created_at).toLocaleDateString('th-TH')}
                    </div>
                    {project.updated_at && (
                      <div className="text-sm text-gray-500">
                        แก้ไขล่าสุด: {new Date(project.updated_at).toLocaleDateString('th-TH')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 