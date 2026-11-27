import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Mail } from 'lucide-react';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '../api/axiosClient';

export default function Register() {
  const [step, setStep] = useState('FORM'); // FORM | OTP | DONE
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authApi.register(form);
      setMessage(res.data.message);
      setStep('OTP');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email: form.email, otp });
      setMessage(res.data.message);
      setStep('DONE');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Xác thực OTP thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    try {
      const res = await authApi.resendOtp({ email: form.email, purpose: 'REGISTER' });
      setMessage(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi lại mã OTP'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm w-full max-w-md p-8 text-black">
        <div className="flex flex-col items-center mb-5">
          <div className="w-11 h-11 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Đăng ký Tài khoản Cư dân</h1>
          <p className="text-slate-600 mt-1">Xác thực OTP Email & chờ BQL gán hộ</p>
        </div>

        {error && <div className="mb-3 p-3 bg-red-50 border border-red-300 text-red-800 rounded">{error}</div>}
        {message && (
          <div className="mb-3 p-3 bg-green-50 border border-green-300 text-green-800 rounded">{message}</div>
        )}

        {step === 'FORM' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block font-medium mb-1">Tên đăng nhập</label>
              <input
                type="text"
                required
                minLength={3}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Họ và tên</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email (nhận OTP)</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Số điện thoại</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912345678"
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Mật khẩu (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded disabled:opacity-50"
            >
              {loading ? 'Đang gửi OTP...' : 'Đăng ký & Nhận OTP'}
            </button>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Nhập mã OTP 6 chữ số đã gửi tới {form.email} (hiệu lực 5 phút):</span>
            </div>
            <input
              type="text"
              required
              maxLength={6}
              pattern="\d{6}"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              className="w-full px-3 py-2 border border-slate-300 rounded text-center font-mono tracking-widest"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full py-2 border border-slate-300 rounded text-black"
            >
              Gửi lại mã OTP
            </button>
          </form>
        )}

        {step === 'DONE' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <p className="text-slate-700">
              Email đã được xác thực thành công. Vui lòng chờ Ban quản lý duyệt và gán hộ gia đình trước khi đăng nhập.
            </p>
            <Link to="/login" className="inline-block px-5 py-2 bg-blue-600 text-white rounded font-medium">
              Quay lại Đăng nhập
            </Link>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-200 text-center">
          <Link to="/login" className="text-blue-700 hover:underline">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
