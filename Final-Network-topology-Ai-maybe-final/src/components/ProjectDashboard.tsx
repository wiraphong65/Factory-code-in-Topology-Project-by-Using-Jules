import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { Plus, FolderOpen, Trash2, Edit3, Calendar, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteProjectModal } from './ui/delete-project-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const ProjectDashboard: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // เพิ่ม ref สำหรับ auto focus
  const createNameRef = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  const { projects, loading, createProject, updateProject, deleteProject, selectProject } = useProject();
  const { user, logout } = useAuth();
  // ลบบรรทัดนี้: const { toast } = useToast();

  useEffect(() => {
    if (isCreateModalOpen) {
      setTimeout(() => createNameRef.current?.focus(), 100);
    }
  }, [isCreateModalOpen]);
  useEffect(() => {
    if (isEditModalOpen) {
      setTimeout(() => editNameRef.current?.focus(), 100);
    }
  }, [isEditModalOpen]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("กรุณากรอกชื่อโปรเจกต์");
      return;
    }

    try {
      await createProject({
        name: newProjectName,
        description: newProjectDescription,
        diagram_data: JSON.stringify({ nodes: [], edges: [] })
      });
      
      // Reset form and close modal
      setNewProjectName('');
      setNewProjectDescription('');
      setIsCreateModalOpen(false);
      
      // อัปเดต URL เพื่อให้สามารถ bookmark ได้
      window.history.pushState({}, '', '/diagram');
      
      toast.success("สร้างโปรเจกต์ใหม่สำเร็จ และเปิดใช้งานแล้ว");
    } catch {
      toast.error("ไม่สามารถสร้างโปรเจกต์ได้");
    }
  };

  const handleEditProject = async () => {
    if (!editingProject || !editingProject.name.trim()) {
      toast.error("กรุณากรอกชื่อโปรเจกต์");
      return;
    }

    try {
      await updateProject(editingProject.id, {
        name: editingProject.name,
        description: editingProject.description
      });
      
      setEditingProject(null);
      setIsEditModalOpen(false);
      
      toast.success("อัปเดตโปรเจกต์สำเร็จ");
    } catch {
      toast.error("ไม่สามารถอัปเดตโปรเจกต์ได้");
    }
  };

  const handleDeleteProject = (projectId: number, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setDeleteProjectModalOpen(true);
  };

  const handleConfirmDeleteProject = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete.id);
        toast.success("ลบโปรเจกต์สำเร็จ");
        setProjectToDelete(null);
      } catch {
        toast.error("ไม่สามารถลบโปรเจกต์ได้");
      }
    }
  };

  const openEditModal = (project: any) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      description: project.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('ออกจากระบบสำเร็จ');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">โปรเจกต์ของฉัน</h1>
              <p className="text-gray-600 mt-2">
                ยินดีต้อนรับ {user?.username} 👋
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 transition-transform duration-150 active:scale-95 hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                สร้างโปรเจกต์ใหม่
              </Button>
              <Button 
                onClick={() => setLogoutModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-transform duration-150 active:scale-95 hover:scale-105"
              >
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีโปรเจกต์</h3>
            <p className="text-gray-600 mb-6">เริ่มต้นสร้างโปรเจกต์แรกของคุณ</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="transition-transform duration-150 active:scale-95 hover:scale-105">
              สร้างโปรเจกต์แรก
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-lg hover:scale-[1.03] transition-all duration-150">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          {project.description && (
                            <CardDescription className="mt-2">
                              {project.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(project)}
                            className="h-8 w-8 p-0 transition-transform duration-150 active:scale-95 hover:scale-110"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 transition-transform duration-150 active:scale-95 hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          สร้างเมื่อ: {new Date(project.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Bangkok' })}
                        </div>
                        {project.updated_at && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Edit3 className="h-4 w-4 mr-2" />
                            แก้ไขล่าสุด: {new Date(project.updated_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Bangkok' })}
                          </div>
                        )}
                        <div className="pt-3">
                          <Button 
                            onClick={() => {
                              selectProject(project);
                              // อัปเดต URL เพื่อให้สามารถ bookmark ได้
                              window.history.pushState({}, '', '/diagram');
                            }}
                            className="w-full transition-transform duration-150 active:scale-95 hover:scale-105"
                            variant="outline"
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            เปิดโปรเจกต์
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างโปรเจกต์ใหม่</DialogTitle>
            <DialogDescription>
              สร้างโปรเจกต์ใหม่สำหรับแผนผังเครือข่าย
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleCreateProject();
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="new-project-name">ชื่อโปรเจกต์ *</label>
                <Input
                  id="new-project-name"
                  ref={createNameRef}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="กรอกชื่อโปรเจกต์"
                  className="mt-1 focus:ring-2 focus:ring-blue-400 transition-shadow"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium">คำอธิบาย</label>
                <Input
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="กรอกคำอธิบาย (ไม่บังคับ)"
                  className="mt-1 focus:ring-2 focus:ring-blue-400 transition-shadow"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={!newProjectName.trim()} className="transition-transform duration-150 active:scale-95 hover:scale-105">
                  สร้างโปรเจกต์
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขโปรเจกต์</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลโปรเจกต์
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleEditProject();
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="edit-project-name">ชื่อโปรเจกต์ *</label>
                <Input
                  id="edit-project-name"
                  ref={editNameRef}
                  value={editingProject?.name || ''}
                  onChange={(e) => setEditingProject((prev: any) => ({ ...prev, name: e.target.value }))}
                  placeholder="กรอกชื่อโปรเจกต์"
                  className="mt-1 focus:ring-2 focus:ring-blue-400 transition-shadow"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium">คำอธิบาย</label>
                <Input
                  value={editingProject?.description || ''}
                  onChange={(e) => setEditingProject((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="กรอกคำอธิบาย (ไม่บังคับ)"
                  className="mt-1 focus:ring-2 focus:ring-blue-400 transition-shadow"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
                  ปิด
                </Button>
                <Button type="submit" disabled={!editingProject?.name?.trim()} className="transition-transform duration-150 active:scale-95 hover:scale-105">
                  บันทึก
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={deleteProjectModalOpen}
        onClose={() => {
          setDeleteProjectModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDeleteProject}
        projectName={projectToDelete?.name || ''}
      />

      {/* Logout Confirmation Modal */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent>
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
                  handleLogout();
                }}
                variant="destructive"
              >
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 