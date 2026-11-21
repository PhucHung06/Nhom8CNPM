// FILE: client/src/pages/AuthAndPasswordPage.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { authApi } from '../api/authApi';

const SESSION_STORAGE_KEY = 'authSession';

function isTokenExpired(token) {
  const payload = token.split('.')[1];
  if (!payload) return true;

  try {
    const decodedPayload = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return typeof decodedPayload.exp === 'number'
      && decodedPayload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export default function AuthAndPasswordPage() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('LOGIN'); // 'LOGIN' | 'CHANGE_PASSWORD'

  // State Form Đăng nhập (UC001)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});
  const [showLoginPass, setShowLoginPass] = useState(false);

  // State Form Đổi mật khẩu (US-014)
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdErrors, setPwdErrors] = useState({});
  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiAlert, setApiAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!token || isTokenExpired(token) || !storedSession) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    try {
      const restoredSession = JSON.parse(storedSession);
      if (!restoredSession?.username || !restoredSession?.role) {
        throw new Error('Invalid stored session');
      }

      setSession({ ...restoredSession, accessToken: token });
      if (restoredSession.passwordExpired) {
        setActiveTab('CHANGE_PASSWORD');
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  // Validate Form Đăng nhập theo đúng đặc tả UC001 trong SRS
  const validateLogin = () => {
    const errors = {};
    const usernameRegex = /^[a-zA-Z0-9_]{4,50}$/;

    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      errors.general = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu';
    }
    if (!loginForm.username.trim()) {
      errors.username = 'Tên đăng nhập không được để trống';
    } else if (!usernameRegex.test(loginForm.username.trim())) {
      errors.username = 'Ký tự chữ và số viết liền, độ dài ≥ 4 ký tự';
    }
    if (!loginForm.password) {
      errors.password = 'Mật khẩu không được để trống';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Tiêu chí kiểm tra độ mạnh mật khẩu mới (Realtime)
  const passwordCriteria = {
    minLength: pwdForm.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(pwdForm.newPassword),
    hasNumber: /[0-9]/.test(pwdForm.newPassword),
    notSameAsOld:
      pwdForm.newPassword.length > 0 &&
      pwdForm.newPassword !== pwdForm.currentPassword,
  };

  const validatePasswordChange = () => {
    const errors = {};
    if (!pwdForm.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (!pwdForm.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (
      !passwordCriteria.minLength ||
      !passwordCriteria.hasUppercase ||
      !passwordCriteria.hasNumber
    ) {
      errors.newPassword =
        'Mật khẩu tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa và 1 số';
    } else if (!passwordCriteria.notSameAsOld) {
      errors.newPassword = 'Mật khẩu mới không được trùng mật khẩu hiện tại';
    }
    if (!pwdForm.confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới';
    } else if (pwdForm.confirmPassword !== pwdForm.newPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setPwdErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gửi request Đăng nhập tới Spring Boot
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setApiAlert({ type: '', message: '' });
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const response = await authApi.login(loginForm);
      const data = response.data;

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      setSession(data);

      // Kiểm tra hạn mật khẩu định kỳ 90 ngày
      if (data.passwordExpired) {
        setActiveTab('CHANGE_PASSWORD');
        setApiAlert({
          type: 'warning',
          message: `Cảnh báo bảo mật định kỳ: Mật khẩu của bạn đã sử dụng ${data.daysSinceLastChange} ngày (vượt quá chu kỳ ${data.maxPasswordAgeDays} ngày). Vui lòng cập nhật mật khẩu mới để tiếp tục làm việc!`,
        });
      } else {
        setApiAlert({
          type: 'success',
          message: `Đăng nhập thành công! Xin chào ${data.fullName} (${data.role}). Chu kỳ mật khẩu: ${data.daysSinceLastChange}/${data.maxPasswordAgeDays} ngày.`,
        });
      }
    } catch (error) {
      if (!error.response) {
        // The API is unavailable; the frontend cannot determine whether MySQL is down.
        setApiAlert({
          type: 'error',
          message:
            'Không thể kết nối đến máy chủ API. Vui lòng kiểm tra backend đang chạy tại http://localhost:8080',
        });
      } else {
        setApiAlert({
          type: 'error',
          message:
            error.response.data?.message ||
            'Tên đăng nhập hoặc mật khẩu không chính xác',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi request Đổi mật khẩu tới Spring Boot
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setApiAlert({ type: '', message: '' });
    if (!validatePasswordChange()) return;

    setIsLoading(true);
    try {
      const targetUser = session?.username || loginForm.username || 'thungan_01';
      const response = await authApi.changePassword(pwdForm, targetUser);

      setApiAlert({
        type: 'success',
        message: response.data.message,
      });

      if (session) {
        const updatedSession = {
          ...session,
          passwordExpired: false,
          daysSinceLastChange: 0,
        };
        setSession(updatedSession);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }
      setActiveTab('LOGIN');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdErrors({});
    } catch (error) {
      setApiAlert({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setActiveTab('LOGIN');
    setLoginForm({ username: '', password: '' });
    setApiAlert({ type: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 text-slate-100">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 mb-3">
          <KeyRound className="w-7 h-7 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          HỆ THỐNG QUẢN LÝ CHUNG CƯ BLUEMOON
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Phân hệ Xác thực & Quản lý Mật khẩu định kỳ (US-014)
        </p>
      </div>

      <motion.div
        layout
        className="w-full max-w-md bg-slate-800/90 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        {session?.passwordExpired && (
          <div className="border-b border-slate-700 bg-slate-800/50">
            <div className="py-3.5 text-center text-sm font-medium text-amber-300">
              <ShieldAlert className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
              Đổi mật khẩu định kỳ
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Thanh trạng thái người dùng sau khi đăng nhập */}
          {session && (
            <div className="mb-4 p-3 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Tài khoản: </span>
                <strong className="text-white">{session.username}</strong>
                <span className="ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                  {session.role}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Đăng xuất
              </button>
            </div>
          )}

          {/* Vùng thông báo Alert */}
          <AnimatePresence mode="wait">
            {apiAlert.message && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mb-5 p-3.5 rounded-xl border text-sm flex items-start gap-2.5 ${
                  apiAlert.type === 'error'
                    ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                    : apiAlert.type === 'warning'
                    ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                    : 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                }`}
              >
                {apiAlert.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                {apiAlert.type === 'warning' && (
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                {apiAlert.type === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span>{apiAlert.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM 1: ĐĂNG NHẬP */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              {loginErrors.general && (
                <p className="text-xs text-rose-400 font-medium">
                  * {loginErrors.general}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tên đăng nhập <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="VD: thungan_01 hoặc admin_01"
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, username: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      loginErrors.username
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {loginErrors.username && (
                  <p className="text-xs text-rose-400 mt-1">
                    {loginErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mật khẩu <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      loginErrors.password
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showLoginPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-xs text-rose-400 mt-1">
                    {loginErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang xác thực...
                  </>
                ) : (
                  'Đăng nhập hệ thống'
                )}
              </button>
            </form>
          )}

          {/* FORM 2: ĐỔI MẬT KHẨU ĐỊNH KỲ */}
          {activeTab === 'CHANGE_PASSWORD' && (
            <form
              onSubmit={handleChangePasswordSubmit}
              className="space-y-4"
              noValidate
            >
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200">
                <strong>Quy định mật khẩu định kỳ:</strong> Mật khẩu phải được
                đổi mới mỗi <strong>90 ngày</strong> và không được trùng với 3
                mật khẩu gần nhất.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mật khẩu hiện tại <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPwd.current ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    value={pwdForm.currentPassword}
                    onChange={(e) =>
                      setPwdForm({
                        ...pwdForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      pwdErrors.currentPassword
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPwd({ ...showPwd, current: !showPwd.current })
                    }
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPwd.current ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {pwdErrors.currentPassword && (
                  <p className="text-xs text-rose-400 mt-1">
                    {pwdErrors.currentPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mật khẩu mới <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPwd.new ? 'text' : 'password'}
                    placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số"
                    value={pwdForm.newPassword}
                    onChange={(e) =>
                      setPwdForm({ ...pwdForm, newPassword: e.target.value })
                    }
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      pwdErrors.newPassword
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPwd({ ...showPwd, new: !showPwd.new })
                    }
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPwd.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {pwdErrors.newPassword && (
                  <p className="text-xs text-rose-400 mt-1">
                    {pwdErrors.newPassword}
                  </p>
                )}

                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
                  <span
                    className={
                      passwordCriteria.minLength
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }
                  >
                    ✓ Tối thiểu 8 ký tự
                  </span>
                  <span
                    className={
                      passwordCriteria.hasUppercase
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }
                  >
                    ✓ Có ít nhất 1 chữ hoa
                  </span>
                  <span
                    className={
                      passwordCriteria.hasNumber
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }
                  >
                    ✓ Có ít nhất 1 chữ số
                  </span>
                  <span
                    className={
                      passwordCriteria.notSameAsOld
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }
                  >
                    ✓ Khác mật khẩu hiện tại
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPwd.confirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={pwdForm.confirmPassword}
                    onChange={(e) =>
                      setPwdForm({
                        ...pwdForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      pwdErrors.confirmPassword
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPwd({ ...showPwd, confirm: !showPwd.confirm })
                    }
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPwd.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {pwdErrors.confirmPassword && (
                  <p className="text-xs text-rose-400 mt-1">
                    {pwdErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  'Cập nhật mật khẩu mới'
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}