import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '../api/axiosClient';

export default function ForgotPassword() {
  const [step, setStep] = useState('EMAIL'); // EMAIL | RESET | DONE
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setMessage(res.data.message);
      setStep('RESET');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi OTP đặt lại mật khẩu'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authApi.resetPassword({ email, otp, newPassword });
      setMessage(res.data.message);
      setStep('DONE');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đặt lại mật khẩu thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm w-full max-w-md p-8 text-black">
        <div className="flex flex-col items-center mb-5">
          <div className="w-11 h-11 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Quên & Đặt lại Mật khẩu</h1>
        </div>

        {error && <div className="mb-3 p-3 bg-red-50 border border-red-300 text-red-800 rounded">{error}</div>}
        {message && (
          <div className="mb-3 p-3 bg-green-50 border border-green-300 text-green-800 rounded">{message}</div>
        )}

        {step === 'EMAIL' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Email tài khoản</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="resident@bluemoon.vn"
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded disabled:opacity-50"
            >
              {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
            </button>
          </form>
        )}

        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="block font-medium mb-1">Mã OTP (6 chữ số)</label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-center"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}
            </button>
          </form>
        )}

        {step === 'DONE' && (
          <div className="text-center">
            <Link to="/login" className="inline-block px-5 py-2 bg-blue-600 text-white rounded font-medium">
              Đăng nhập ngay
            </Link>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-200 text-center">
          <Link to="/login" className="text-blue-700 hover:underline">
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
