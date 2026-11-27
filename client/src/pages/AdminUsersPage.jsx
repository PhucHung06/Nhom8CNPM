import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Plus, Search, Trash2, UserCog } from 'lucide-react';
import { adminUserApi } from '../api/adminUserApi';
import { householdApi } from '../api/householdApi';
import { getApiErrorMessage } from '../api/axiosClient';

const APPROVAL_BADGE = {
  APPROVED: { text: 'Đã duyệt', cls: 'bg-green-100 text-green-800' },
  PENDING: { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800' },
  REJECTED: { text: 'Từ chối', cls: 'bg-red-100 text-red-800' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', role: 'ALL', approvalStatus: 'ALL' });
  const [errorMsg, setErrorMsg] = useState('');
  const [modalError, setModalError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'ADMIN',
    householdId: '',
  });

  const [grantModal, setGrantModal] = useState({ open: false, user: null });
  const [grantForm, setGrantForm] = useState({ approvalStatus: 'APPROVED', householdId: '' });

  const loadData = useCallback(async () => {
    try {
      const [userRes, hhRes] = await Promise.all([
        adminUserApi.getAll(filters),
        householdApi.getAll({ status: 'ACTIVE' }),
      ]);
      setUsers(userRes.data);
      setHouseholds(hhRes.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách tài khoản'));
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await adminUserApi.create({
        ...createForm,
        householdId:
          createForm.role === 'RESIDENT' && createForm.householdId ? Number(createForm.householdId) : null,
      });
      setCreateOpen(false);
      setCreateForm({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'ADMIN',
        householdId: '',
      });
      loadData();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể tạo tài khoản'));
    }
  };

  const openGrant = (u) => {
    setGrantForm({
      approvalStatus: u.approvalStatus === 'REJECTED' ? 'REJECTED' : 'APPROVED',
      householdId: u.householdId ? String(u.householdId) : households[0]?.id ? String(households[0].id) : '',
    });
    setGrantModal({ open: true, user: u });
    setModalError('');
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await adminUserApi.grantAccess(grantModal.user.id, {
        approvalStatus: grantForm.approvalStatus,
        householdId: grantForm.householdId ? Number(grantForm.householdId) : null,
      });
      setGrantModal({ open: false, user: null });
      loadData();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể duyệt / gán hộ cho tài khoản'));
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Xác nhận xóa mềm tài khoản ${u.username}?`)) return;
    try {
      await adminUserApi.remove(u.id);
      loadData();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể xóa tài khoản'));
    }
  };

  return (
    <div className="space-y-5 bg-white text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Quản trị Tài khoản & Duyệt cư dân (PB-002)</h1>
          <p className="text-slate-600">Tạo tài khoản nội bộ, duyệt tài khoản cư dân & gán hộ gia đình (Grant-access)</p>
        </div>
        <button
          onClick={() => {
            setModalError('');
            setCreateOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          <Plus className="w-4 h-4" /> Tạo tài khoản
        </button>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">{errorMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            placeholder="Tìm username, họ tên, email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded bg-white"
          />
        </div>
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="ADMIN">ADMIN (Ban quản lý)</option>
          <option value="RESIDENT">RESIDENT (Cư dân)</option>
        </select>
        <select
          value={filters.approvalStatus}
          onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả trạng thái duyệt</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-left">Username</th>
              <th className="py-2.5 px-3 text-left">Họ và tên</th>
              <th className="py-2.5 px-3 text-left">Email</th>
              <th className="py-2.5 px-3 text-left">Vai trò</th>
              <th className="py-2.5 px-3 text-left">OTP Email</th>
              <th className="py-2.5 px-3 text-left">Duyệt</th>
              <th className="py-2.5 px-3 text-left">Hộ gắn kết</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => {
              const badge = APPROVAL_BADGE[u.approvalStatus] || APPROVAL_BADGE.PENDING;
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-left font-medium">{u.username}</td>
                  <td className="py-2.5 px-3 text-left">{u.fullName}</td>
                  <td className="py-2.5 px-3 text-left">{u.email || '-'}</td>
                  <td className="py-2.5 px-3 text-left font-medium">{u.role}</td>
                  <td className="py-2.5 px-3 text-left">{u.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</td>
                  <td className="py-2.5 px-3 text-left">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-left">
                    {u.apartmentCode ? `${u.apartmentCode} (${u.householdHeadName})` : 'Chưa gán'}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openGrant(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-blue-300 text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                        title="Duyệt & gán hộ"
                      >
                        <UserCog className="w-3.5 h-3.5" /> Grant-access
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50"
                        title="Xóa mềm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Không có tài khoản nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-md p-6">
            <h2 className="text-base font-bold mb-4">Tạo tài khoản mới</h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  required
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Mật khẩu (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Vai trò</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="RESIDENT">RESIDENT</option>
                  </select>
                </div>
              </div>
              {createForm.role === 'RESIDENT' && (
                <div>
                  <label className="block font-medium mb-1">Gán vào hộ gia đình</label>
                  <select
                    value={createForm.householdId}
                    onChange={(e) => setCreateForm({ ...createForm, householdId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Chọn sau --</option>
                    {households.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.apartmentCode} - {h.headName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {grantModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-md p-6">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Duyệt & Gán hộ: {grantModal.user?.username}
            </h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            <form onSubmit={handleGrant} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Trạng thái duyệt</label>
                <select
                  value={grantForm.approvalStatus}
                  onChange={(e) => setGrantForm({ ...grantForm, approvalStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                >
                  <option value="APPROVED">APPROVED (Phê duyệt)</option>
                  <option value="REJECTED">REJECTED (Từ chối)</option>
                </select>
              </div>
              {grantForm.approvalStatus === 'APPROVED' && grantModal.user?.role === 'RESIDENT' && (
                <div>
                  <label className="block font-medium mb-1">Hộ gia đình gán quyền</label>
                  <select
                    required
                    value={grantForm.householdId}
                    onChange={(e) => setGrantForm({ ...grantForm, householdId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Chọn hộ gia đình --</option>
                    {households.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.apartmentCode} - {h.headName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGrantModal({ open: false, user: null })}
                  className="px-4 py-2 border border-slate-300 rounded"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
                  Lưu phân quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
