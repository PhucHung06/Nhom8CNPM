import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Home, KeyRound, LogOut, UserCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  const handleLogout = () => {
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
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <Building2 className="w-7 h-7 text-blue-400" />
          <div>
            <div className="font-bold text-base">BlueMoon v1.0</div>
            <div className="text-xs text-slate-400">Ban Quản Trị Chung Cư</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/apartments"
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium ${
              location.pathname === '/apartments' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            <Home className="w-4 h-4" />
            Căn hộ & Nhân khẩu
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="px-2 py-1">
            <div className="text-sm font-medium text-white truncate">{user.fullName || 'Người dùng'}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3 h-3" /> {user.role}
            </div>
          </div>
          <button
            onClick={() => { setShowPwdModal(true); setPwdMsg({ type: '', text: '' }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 bg-slate-800 rounded"
          >
            <KeyRound className="w-3.5 h-3.5" /> Đổi mật khẩu
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-300 bg-slate-800 rounded"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng xuất
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
