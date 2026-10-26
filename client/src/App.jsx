// FILE: client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Building2, KeyRound, ShieldCheck } from 'lucide-react';
import AuthAndPasswordPage from './pages/AuthAndPasswordPage';
import ApartmentListPage from './pages/ApartmentListPage';

function App() {
  const [activeModule, setActiveModule] = useState('AUTH'); // 'AUTH' | 'APARTMENTS'
  const [hasToken, setHasToken] = useState(
    () => Boolean(localStorage.getItem('accessToken'))
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem('userRole') || ''
  );

  // Đồng bộ trạng thái đăng nhập khi người dùng thao tác trên AuthAndPasswordPage
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('userRole') || '';
      setHasToken(Boolean(token));
      setUserRole(role);
    };
    window.addEventListener('storage', syncAuth);
    const interval = setInterval(syncAuth, 800);
    return () => {
      window.removeEventListener('storage', syncAuth);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation Bar hiển thị khi đã có JWT Token */}
      {hasToken && (
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                BM
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">
                  BLUEMOON APARTMENT ERP
                </h1>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Vai trò hiện tại: <strong className="text-blue-300">{userRole}</strong>
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveModule('APARTMENTS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  activeModule === 'APARTMENTS'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Quản lý Hộ gia đình & Căn hộ (US-001)
              </button>

              <button
                type="button"
                onClick={() => setActiveModule('AUTH')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  activeModule === 'AUTH'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                Tài khoản & Đổi mật khẩu (US-014)
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* Nội dung Module */}
      <main className="flex-1">
        {activeModule === 'APARTMENTS' && hasToken ? (
          <div className="max-w-7xl mx-auto p-6">
            <ApartmentListPage currentUser={{ role: userRole }} />
          </div>
        ) : (
          <AuthAndPasswordPage />
        )}
      </main>
    </div>
  );
}

export default App;