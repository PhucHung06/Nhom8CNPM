import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, User } from 'lucide-react';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '../api/axiosClient';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      const data = res.data;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem(
        'user',
        JSON.stringify({
          userId: data.userId,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          householdId: data.householdId,
          apartmentCode: data.apartmentCode,
          menus: data.menus || [],
        })
      );
      navigate(data.role === 'ADMIN' ? '/apartments' : '/resident/home');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm w-full max-w-md p-8 text-black">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-3">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-black">BlueMoon Apartment</h1>
          <p className="text-slate-600 mt-1">Hệ thống Quản lý Chung cư Web v1.0</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-black mb-1">Tên đăng nhập</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin_01"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-black mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-blue-700">
          <Link to="/register" className="hover:underline">
            Đăng ký tài khoản cư dân
          </Link>
          <Link to="/forgot-password" className="hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
      </div>
    </div>
  );
}
