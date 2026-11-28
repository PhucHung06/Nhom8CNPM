import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Banknote,
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Home,
  KeyRound,
  LogOut,
  Menu,
  Receipt,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
  X,
  Zap,
} from 'lucide-react';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '../api/axiosClient';

const MENU_ICONS = {
  apartments: Home,
  households: UsersRound,
  residents: Users,
  fees: Receipt,
  utilities: Zap,
  billing_cycles: CalendarRange,
  invoices: Banknote,
  admin_users: ShieldCheck,
  resident_home: Building2,
};

function getDefaultMenus(role) {
  if (role === 'ADMIN') {
    return [
      { key: 'apartments', label: 'Quản lý Căn hộ', path: '/apartments' },
      { key: 'households', label: 'Quản lý Hộ gia đình', path: '/households' },
      { key: 'residents', label: 'Quản lý Nhân khẩu', path: '/residents' },
      { key: 'fees', label: 'Quản lý Khoản thu', path: '/fees' },
      { key: 'utilities', label: 'Điện / Nước / Internet', path: '/utilities' },
      { key: 'billing_cycles', label: 'Đợt thu & Hóa đơn', path: '/billing-cycles' },
      { key: 'invoices', label: 'Thu tiền mặt', path: '/invoices' },
      { key: 'admin_users', label: 'Tài khoản & Duyệt cư dân', path: '/admin/users' },
    ];
  }
  return [{ key: 'resident_home', label: 'Thông tin Căn hộ & Hộ', path: '/resident/home' }];
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const menus = Array.isArray(user.menus) && user.menus.length > 0 ? user.menus : getDefaultMenus(user.role);

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
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
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    try {
      const res = await authApi.changePassword({ oldPassword, newPassword });
      setPwdMsg({ type: 'success', text: res.data.message });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: getApiErrorMessage(err, 'Đổi mật khẩu thất bại') });
    }
  };

  const renderNavLinks = (isMobile = false) =>
    menus.map((item) => {
      const Icon = MENU_ICONS[item.key] || Home;
      const active = location.pathname === item.path;
      return (
        <Link
          key={item.key}
          to={item.path}
          onClick={() => isMobile && setMobileOpen(false)}
          title={item.label}
          className={`flex items-center ${
            collapsed && !isMobile ? 'justify-center px-2' : 'gap-3 px-3'
          } py-2.5 rounded text-sm font-medium transition ${
            active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-white text-black flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-14 bg-slate-900 text-white px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-blue-400" />
          <span className="font-bold">BlueMoon v1.0</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded text-slate-300 hover:bg-slate-800"
          aria-label="Mở menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 text-white px-3 py-3 space-y-1 border-t border-slate-800">
          {renderNavLinks(true)}
          <div className="pt-2 border-t border-slate-800 flex gap-2">
            <button
              onClick={() => {
                setShowPwdModal(true);
                setPwdMsg({ type: '', text: '' });
                setMobileOpen(false);
              }}
              className="flex-1 py-2 px-3 text-xs bg-slate-800 rounded text-slate-200"
            >
              Đổi mật khẩu
            </button>
            <button onClick={handleLogout} className="flex-1 py-2 px-3 text-xs bg-slate-800 rounded text-red-300">
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex ${
          collapsed ? 'w-16' : 'w-64'
        } bg-slate-900 text-white flex-col shrink-0 transition-all duration-200`}
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
                <div className="font-bold leading-tight">BlueMoon v1.0</div>
                <div className="text-xs text-slate-400 truncate">
                  {user.role === 'ADMIN' ? 'Ban Quản Lý' : 'Cổng Cư Dân'}
                </div>
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

        <nav className="flex-1 p-2.5 space-y-1">{renderNavLinks(false)}</nav>

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
                <div className="font-medium text-white truncate">{user.fullName || 'Người dùng'}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <UserCheck className="w-3 h-3 shrink-0" /> {user.role}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setShowPwdModal(true);
              setPwdMsg({ type: '', text: '' });
            }}
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

      <main className="flex-1 p-4 md:p-6 bg-white text-black overflow-auto">
        <Outlet />
      </main>

      {showPwdModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-md p-6">
            <h2 className="text-base font-bold text-black mb-4">Đổi mật khẩu tài khoản</h2>
            {pwdMsg.text && (
              <div
                className={`mb-3 p-2.5 rounded border ${
                  pwdMsg.type === 'success'
                    ? 'bg-green-50 text-green-800 border-green-300'
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}
              >
                {pwdMsg.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block font-medium text-black mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-medium text-black mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPwdModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-black"
                >
                  Đóng
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
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
