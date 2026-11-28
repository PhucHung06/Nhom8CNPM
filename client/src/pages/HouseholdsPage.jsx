import { useCallback, useEffect, useState } from 'react';
import { LogIn, LogOut, Pencil, Search, Users } from 'lucide-react';
import { householdApi } from '../api/householdApi';
import { apartmentApi } from '../api/apartmentApi';
import { getApiErrorMessage } from '../api/axiosClient';

const STATUS_BADGE = {
  ACTIVE: { text: 'Đang cư trú (ACTIVE)', cls: 'bg-green-100 text-green-800' },
  MOVED_OUT: { text: 'Đã chuyển đi (MOVED_OUT)', cls: 'bg-slate-200 text-slate-800' },
};

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState([]);
  const [availableApts, setAvailableApts] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', status: 'ALL' });
  const [errorMsg, setErrorMsg] = useState('');
  const [modalError, setModalError] = useState('');

  const [moveInOpen, setMoveInOpen] = useState(false);
  const [moveInForm, setMoveInForm] = useState({
    apartmentId: '',
    headName: '',
    headCccd: '',
    phone: '',
    moveInDate: new Date().toISOString().slice(0, 10),
    headDob: '1990-01-01',
    headGender: 'Nam',
  });

  const [editModal, setEditModal] = useState({ open: false, household: null });
  const [editForm, setEditForm] = useState({ headName: '', headCccd: '', phone: '' });

  const [accountsModal, setAccountsModal] = useState({ open: false, household: null, accounts: [] });

  const loadHouseholds = useCallback(async () => {
    try {
      const res = await householdApi.getAll(filters);
      setHouseholds(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách hộ gia đình'));
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHouseholds();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadHouseholds]);

  const openMoveIn = async () => {
    setModalError('');
    try {
      const res = await apartmentApi.getAll({ status: 'AVAILABLE' });
      setAvailableApts(res.data);
      setMoveInForm({
        apartmentId: res.data[0]?.id ? String(res.data[0].id) : '',
        headName: '',
        headCccd: '',
        phone: '',
        moveInDate: new Date().toISOString().slice(0, 10),
        headDob: '1990-01-01',
        headGender: 'Nam',
      });
      setMoveInOpen(true);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách căn hộ trống'));
    }
  };

  const handleMoveIn = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await householdApi.moveIn({
        ...moveInForm,
        apartmentId: Number(moveInForm.apartmentId),
      });
      setMoveInOpen(false);
      loadHouseholds();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể chuyển hộ đến'));
    }
  };

  const openEdit = (h) => {
    setEditForm({ headName: h.headName, headCccd: h.headCccd, phone: h.phone });
    setEditModal({ open: true, household: h });
    setModalError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await householdApi.update(editModal.household.id, editForm);
      setEditModal({ open: false, household: null });
      loadHouseholds();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể cập nhật hộ gia đình'));
    }
  };

  const handleMoveOut = async (h) => {
    if (!window.confirm(`Xác nhận chuyển hộ đi cho căn ${h.apartmentCode} (${h.headName})? Căn hộ sẽ chuyển về AVAILABLE.`)) {
      return;
    }
    try {
      await householdApi.moveOut(h.id, { moveOutDate: new Date().toISOString().slice(0, 10) });
      loadHouseholds();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể thực hiện Move-out'));
    }
  };

  const openAccounts = async (h) => {
    try {
      const res = await householdApi.getAccounts(h.id);
      setAccountsModal({ open: true, household: h, accounts: res.data });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải tài khoản liên kết hộ'));
    }
  };

  return (
    <div className="space-y-5 bg-white text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Quản lý Hộ gia đình (PB-004)</h1>
          <p className="text-slate-600">Chuyển hộ đến (Move-in), Chuyển hộ đi (Move-out) & Tài khoản liên kết</p>
        </div>
        <button
          onClick={openMoveIn}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          <LogIn className="w-4 h-4" /> Chuyển hộ đến (Move-in)
        </button>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">{errorMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            placeholder="Tìm theo mã căn hộ, tên chủ hộ, CCCD, SĐT..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded bg-white"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang cư trú (ACTIVE)</option>
          <option value="MOVED_OUT">Đã chuyển đi (MOVED_OUT)</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-left">Căn hộ</th>
              <th className="py-2.5 px-3 text-left">Chủ hộ</th>
              <th className="py-2.5 px-3 text-left">CCCD chủ hộ</th>
              <th className="py-2.5 px-3 text-left">Số điện thoại</th>
              <th className="py-2.5 px-3 text-left">Ngày đến / đi</th>
              <th className="py-2.5 px-3 text-right">Nhân khẩu</th>
              <th className="py-2.5 px-3 text-right">Tài khoản</th>
              <th className="py-2.5 px-3 text-left">Trạng thái</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {households.map((h) => {
              const badge = STATUS_BADGE[h.status] || STATUS_BADGE.ACTIVE;
              return (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-left font-semibold text-blue-700">{h.apartmentCode}</td>
                  <td className="py-2.5 px-3 text-left font-medium">{h.headName}</td>
                  <td className="py-2.5 px-3 text-left font-mono">{h.headCccd}</td>
                  <td className="py-2.5 px-3 text-left">{h.phone}</td>
                  <td className="py-2.5 px-3 text-left">
                    {h.moveInDate}
                    {h.moveOutDate ? ` → ${h.moveOutDate}` : ''}
                  </td>
                  <td className="py-2.5 px-3 num-cell">{h.residentCount}</td>
                  <td className="py-2.5 px-3 num-cell">{h.linkedAccountCount}</td>
                  <td className="py-2.5 px-3 text-left">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openAccounts(h)}
                        className="p-1.5 border border-slate-300 rounded hover:bg-slate-100"
                        title="Xem tài khoản liên kết hộ"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(h)}
                        className="p-1.5 border border-slate-300 rounded hover:bg-slate-100"
                        title="Cập nhật thông tin chủ hộ"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {h.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleMoveOut(h)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-amber-300 text-amber-800 bg-amber-50 rounded hover:bg-amber-100"
                          title="Chuyển hộ đi"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Move-out
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {households.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  Chưa có dữ liệu hộ gia đình
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {moveInOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-md p-6">
            <h2 className="text-base font-bold mb-4">Chuyển hộ đến (Move-in)</h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            {availableApts.length === 0 ? (
              <div className="space-y-4">
                <p className="text-slate-700">Hiện không có căn hộ nào ở trạng thái AVAILABLE để chuyển đến.</p>
                <div className="flex justify-end">
                  <button onClick={() => setMoveInOpen(false)} className="px-4 py-2 border border-slate-300 rounded">
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleMoveIn} className="space-y-3">
                <div>
                  <label className="block font-medium mb-1">Chọn căn hộ trống (AVAILABLE)</label>
                  <select
                    required
                    value={moveInForm.apartmentId}
                    onChange={(e) => setMoveInForm({ ...moveInForm, apartmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {availableApts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.apartmentCode} (Tầng {a.floor} - {a.area} m²)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Họ tên chủ hộ</label>
                  <input
                    type="text"
                    required
                    value={moveInForm.headName}
                    onChange={(e) => setMoveInForm({ ...moveInForm, headName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Số CCCD chủ hộ (12 chữ số)</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    pattern="\d{12}"
                    value={moveInForm.headCccd}
                    onChange={(e) => setMoveInForm({ ...moveInForm, headCccd: e.target.value })}
                    placeholder="001090001234"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      required
                      value={moveInForm.phone}
                      onChange={(e) => setMoveInForm({ ...moveInForm, phone: e.target.value })}
                      placeholder="0912345678"
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Ngày chuyển đến</label>
                    <input
                      type="date"
                      required
                      value={moveInForm.moveInDate}
                      onChange={(e) => setMoveInForm({ ...moveInForm, moveInDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Ngày sinh chủ hộ</label>
                    <input
                      type="date"
                      required
                      value={moveInForm.headDob}
                      onChange={(e) => setMoveInForm({ ...moveInForm, headDob: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Giới tính chủ hộ</label>
                    <select
                      value={moveInForm.headGender}
                      onChange={(e) => setMoveInForm({ ...moveInForm, headGender: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Hệ thống sẽ tự động thêm chủ hộ vào danh sách Nhân khẩu (Thường trú).
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMoveInOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
                    Xác nhận Move-in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-md p-6">
            <h2 className="text-base font-bold mb-4">Cập nhật hộ căn {editModal.household?.apartmentCode}</h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Họ tên chủ hộ</label>
                <input
                  type="text"
                  required
                  value={editForm.headName}
                  onChange={(e) => setEditForm({ ...editForm, headName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">CCCD chủ hộ (12 số)</label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  pattern="\d{12}"
                  value={editForm.headCccd}
                  onChange={(e) => setEditForm({ ...editForm, headCccd: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Số điện thoại</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, household: null })}
                  className="px-4 py-2 border border-slate-300 rounded"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {accountsModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-lg p-6">
            <h2 className="text-base font-bold mb-3">
              Tài khoản liên kết hộ {accountsModal.household?.apartmentCode} ({accountsModal.household?.headName})
            </h2>
            <div className="border border-slate-200 rounded overflow-x-auto mb-4">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left">Username</th>
                    <th className="py-2 px-3 text-left">Họ tên</th>
                    <th className="py-2 px-3 text-left">Email</th>
                    <th className="py-2 px-3 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {accountsModal.accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td className="py-2 px-3 text-left font-medium">{acc.username}</td>
                      <td className="py-2 px-3 text-left">{acc.fullName}</td>
                      <td className="py-2 px-3 text-left">{acc.email}</td>
                      <td className="py-2 px-3 text-left">{acc.approvalStatus}</td>
                    </tr>
                  ))}
                  {accountsModal.accounts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">
                        Chưa có tài khoản cư dân nào được gán vào hộ này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setAccountsModal({ open: false, household: null, accounts: [] })}
                className="px-4 py-2 border border-slate-300 rounded"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
