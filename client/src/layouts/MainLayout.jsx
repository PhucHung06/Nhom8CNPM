import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, ChevronLeft, ChevronRight, Home, KeyRound, LogOut, UserCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    try {
      const res = await axiosClient.put('/auth/change-password', { oldPassword, newPassword });
      setPwdMsg({ type: 'success', text: res.data.message });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Đổi mật khẩu thất bại' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-200`}
      >
        <div
          className={`h-16 border-b border-slate-800 flex items-center ${
            collapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <Building2 className="w-7 h-7 text-blue-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-base leading-tight">BlueMoon v1.0</div>
                <div className="text-xs text-slate-400 truncate">Ban Quản Trị Chung Cư</div>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2.5 space-y-1">
          <Link
            to="/apartments"
            title="Căn hộ & Nhân khẩu"
            className={`flex items-center ${
              collapsed ? 'justify-center px-2' : 'gap-3 px-3'
            } py-2.5 rounded text-sm font-medium transition ${
              location.pathname === '/apartments' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Căn hộ & Nhân khẩu</span>}
          </Link>
        </nav>

        <div className="p-2.5 border-t border-slate-800 space-y-2">
          <div className={`flex items-center ${collapsed ? 'justify-center py-1' : 'gap-2.5 px-2 py-1'}`}>
            <div
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-blue-300 shrink-0"
              title={`${user.fullName || 'Người dùng'} (${user.role || ''})`}
            >
              {(user.fullName || 'U').trim().charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate">{user.fullName || 'Người dùng'}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <UserCheck className="w-3 h-3 shrink-0" /> {user.role}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => { setShowPwdModal(true); setPwdMsg({ type: '', text: '' }); }}
            title="Đổi mật khẩu"
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2' : 'gap-2 px-3'
            } py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Đổi mật khẩu</span>}
          </button>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2' : 'gap-2 px-3'
            } py-2 text-xs text-red-300 bg-slate-800 hover:bg-slate-700 rounded transition`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>

      {showPwdModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Đổi mật khẩu tài khoản</h2>
            {pwdMsg.text && (
              <div className={`mb-3 p-2.5 text-sm rounded ${
                pwdMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {pwdMsg.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPwdModal(false)}
                  className="px-4 py-2 text-sm border border-slate-300 rounded text-slate-700"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded font-medium"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
