import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { changePasswordApi } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  // แยก state login/register
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePassEmail, setChangePassEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassErrors, setChangePassErrors] = useState<any>({});
  // เพิ่ม state สำหรับแสดง/ซ่อนรหัสผ่าน
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, register } = useAuth();

  // เคลียร์ฟอร์มเมื่อเปลี่ยน tab
  useEffect(() => {
    setErrors({});
    if (isLogin) {
      setRegisterEmail('');
      setRegisterUsername('');
      setRegisterPassword('');
    } else {
      setLoginEmail('');
      setLoginPassword('');
    }
  }, [isLogin]);

  // Validation helper
  const validate = () => {
    const newErrors: any = {};
    if (isLogin) {
      if (!loginEmail) newErrors.loginEmail = 'กรุณากรอกอีเมล';
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(loginEmail)) newErrors.loginEmail = 'รูปแบบอีเมลไม่ถูกต้อง';
      if (!loginPassword) newErrors.loginPassword = 'กรุณากรอกรหัสผ่าน';
    } else {
      if (!registerUsername) newErrors.registerUsername = 'กรุณากรอกชื่อผู้ใช้';
      else if (registerUsername.length < 3) newErrors.registerUsername = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
      if (!registerEmail) newErrors.registerEmail = 'กรุณากรอกอีเมล';
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(registerEmail)) newErrors.registerEmail = 'รูปแบบอีเมลไม่ถูกต้อง';
      if (!registerPassword) newErrors.registerPassword = 'กรุณากรอกรหัสผ่าน';
      else if (registerPassword.length < 6) newErrors.registerPassword = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    if (!validate()) {
      setLoading(false);
      return;
    }
    try {
      if (isLogin) {
        await login(loginEmail, loginPassword);
        toast.success("ยินดีต้อนรับกลับมา!");
        // ไม่ต้อง reload หน้า เพราะ React จะจัดการ state เอง
      } else {
        await register(registerEmail, registerUsername, registerPassword);
        toast.success("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Network Topology AI</CardTitle>
          <CardDescription className="text-center">
            เข้าสู่ระบบเพื่อจัดการโปรเจกต์ของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => !loading && setIsLogin(value === "login")}> 
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" disabled={loading}>เข้าสู่ระบบ</TabsTrigger>
              <TabsTrigger value="register" disabled={loading}>สมัครสมาชิก</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              {isLogin ? (
                <TabsContent value="login" forceMount>
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="login-email" className="block text-sm font-medium">อีเมล</label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="อีเมล"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={loading}
                        aria-label="อีเมล"
                        className="focus:ring-2 focus:ring-blue-400 transition-shadow"
                      />
                      <AnimatePresence>
                        {errors.loginEmail && (
                          <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="text-xs text-red-600 mt-1"
                          >
                            {errors.loginEmail}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative">
                      <label htmlFor="login-password" className="block text-sm font-medium">รหัสผ่าน</label>
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="รหัสผ่าน"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={loading}
                        aria-label="รหัสผ่าน"
                        autoComplete="current-password"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSubmit(e);
                        }}
                        className="focus:ring-2 focus:ring-blue-400 transition-shadow"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2 top-8 text-gray-400 hover:text-gray-700"
                        onClick={() => setShowLoginPassword(v => !v)}
                        style={{ background: 'none', border: 'none', padding: 0 }}
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <AnimatePresence>
                        {errors.loginPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="text-xs text-red-600 mt-1"
                          >
                            {errors.loginPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        type="button" 
                        className="text-xs text-blue-600 hover:underline" 
                        tabIndex={-1} 
                        onClick={() => setShowChangePassword(true)}
                        disabled={loading}
                      >
                        เปลี่ยนรหัสผ่าน
                      </button>
                    </div>
                    <Button type="submit" className="w-full transition-transform duration-150 active:scale-95 hover:scale-105" disabled={loading} aria-label="เข้าสู่ระบบ">
                      {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </Button>
                  </motion.form>
                </TabsContent>
              ) : (
                <TabsContent value="register" forceMount>
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="register-username" className="block text-sm font-medium">ชื่อผู้ใช้</label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="ชื่อผู้ใช้"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                        disabled={loading}
                        aria-label="ชื่อผู้ใช้"
                        className="focus:ring-2 focus:ring-blue-400 transition-shadow"
                      />
                      <AnimatePresence>
                        {errors.registerUsername && (
                          <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="text-xs text-red-600 mt-1"
                          >
                            {errors.registerUsername}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <label htmlFor="register-email" className="block text-sm font-medium">อีเมล</label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="อีเมล"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        disabled={loading}
                        aria-label="อีเมล"
                        className="focus:ring-2 focus:ring-blue-400 transition-shadow"
                      />
                      <AnimatePresence>
                        {errors.registerEmail && (
                          <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="text-xs text-red-600 mt-1"
                          >
                            {errors.registerEmail}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative">
                      <label htmlFor="register-password" className="block text-sm font-medium">รหัสผ่าน</label>
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="รหัสผ่าน"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        disabled={loading}
                        aria-label="รหัสผ่าน"
                        autoComplete="new-password"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSubmit(e);
                        }}
                        className="focus:ring-2 focus:ring-blue-400 transition-shadow"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2 top-8 text-gray-400 hover:text-gray-700"
                        onClick={() => setShowRegisterPassword(v => !v)}
                        style={{ background: 'none', border: 'none', padding: 0 }}
                      >
                        {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <AnimatePresence>
                        {errors.registerPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="text-xs text-red-600 mt-1"
                          >
                            {errors.registerPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <Button type="submit" className="w-full transition-transform duration-150 active:scale-95 hover:scale-105" disabled={loading} aria-label="สมัครสมาชิก">
                      {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                    </Button>
                  </motion.form>
                </TabsContent>
              )}
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
      {/* Change Password Modal */}
      <Dialog open={showChangePassword} onOpenChange={(open) => {
        if (!changePassLoading) {
          setShowChangePassword(open);
          if (!open) {
            setChangePassEmail('');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setChangePassErrors({});
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเพื่อเปลี่ยนรหัสผ่าน
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setChangePassErrors({});
              if (!changePassEmail) return setChangePassErrors({ email: 'กรุณากรอกอีเมล' });
              else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(changePassEmail)) return setChangePassErrors({ email: 'รูปแบบอีเมลไม่ถูกต้อง' });
              if (!oldPassword) return setChangePassErrors({ oldPassword: 'กรุณากรอกรหัสผ่านเดิม' });
              if (!newPassword) return setChangePassErrors({ newPassword: 'กรุณากรอกรหัสผ่านใหม่' });
              if (newPassword.length < 6) return setChangePassErrors({ newPassword: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
              if (newPassword !== confirmPassword) return setChangePassErrors({ confirmPassword: 'รหัสผ่านใหม่ไม่ตรงกัน' });
              setChangePassLoading(true);
              try {
                await changePasswordApi({
                  email: changePassEmail,
                  current_password: oldPassword,
                  new_password: newPassword,
                });
                toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
                setShowChangePassword(false);
                setChangePassEmail('');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              } catch (err: any) {
                toast.error(err.response?.data?.detail || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
              } finally {
                setChangePassLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="change-password-email" className="block text-sm font-medium">อีเมล</label>
              <Input
                id="change-password-email"
                type="email"
                value={changePassEmail}
                onChange={e => setChangePassEmail(e.target.value)}
                required
                disabled={changePassLoading}
                className="focus:ring-2 focus:ring-blue-400 transition-shadow"
              />
              <AnimatePresence>
                {changePassErrors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="text-xs text-red-600 mt-1"
                  >
                    {changePassErrors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <label htmlFor="old-password" className="block text-sm font-medium">รหัสผ่านเดิม</label>
              <Input
                id="old-password"
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
                disabled={changePassLoading}
                autoComplete="current-password"
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.form?.requestSubmit();
                }}
                className="focus:ring-2 focus:ring-blue-400 transition-shadow"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-700"
                onClick={() => setShowOldPassword(v => !v)}
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <AnimatePresence>
                {changePassErrors.oldPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="text-xs text-red-600 mt-1"
                  >
                    {changePassErrors.oldPassword}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <label htmlFor="new-password" className="block text-sm font-medium">รหัสผ่านใหม่</label>
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={changePassLoading}
                autoComplete="new-password"
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.form?.requestSubmit();
                }}
                className="focus:ring-2 focus:ring-blue-400 transition-shadow"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-700"
                onClick={() => setShowNewPassword(v => !v)}
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <AnimatePresence>
                {changePassErrors.newPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="text-xs text-red-600 mt-1"
                  >
                    {changePassErrors.newPassword}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <label htmlFor="confirm-password" className="block text-sm font-medium">ยืนยันรหัสผ่านใหม่</label>
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={changePassLoading}
                autoComplete="new-password"
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.form?.requestSubmit();
                }}
                className="focus:ring-2 focus:ring-blue-400 transition-shadow"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(v => !v)}
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <AnimatePresence>
                {changePassErrors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="text-xs text-red-600 mt-1"
                  >
                    {changePassErrors.confirmPassword}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <Button type="submit" className="w-full transition-transform duration-150 active:scale-95 hover:scale-105" disabled={changePassLoading}>
              {changePassLoading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'บันทึก'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 