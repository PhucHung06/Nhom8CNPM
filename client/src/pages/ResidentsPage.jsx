import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { residentApi } from '../api/residentApi';
import { householdApi } from '../api/householdApi';
import { getApiErrorMessage } from '../api/axiosClient';

const STATUS_LABELS = {
  THUONG_TRU: { text: 'Thường trú', cls: 'bg-green-100 text-green-800' },
  TAM_TRU: { text: 'Tạm trú', cls: 'bg-amber-100 text-amber-800' },
};

const EMPTY_FORM = {
  householdId: '',
  fullName: '',
  dob: '',
  gender: 'Nam',
  cccdNumber: '',
  relationshipWithOwner: 'Con',
  residenceStatus: 'THUONG_TRU',
};

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', householdId: '', status: 'ALL' });
  const [errorMsg, setErrorMsg] = useState('');
  const [modalError, setModalError] = useState('');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    try {
      const [resRes, hhRes] = await Promise.all([
        residentApi.getAll(filters),
        householdApi.getAll({ status: 'ACTIVE' }),
      ]);
      setResidents(resRes.data);
      setHouseholds(hhRes.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách nhân khẩu'));
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadData]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      householdId: households[0]?.id ? String(households[0].id) : '',
    });
    setModal({ open: true, editing: null });
    setModalError('');
  };

  const openEdit = (res) => {
    setForm({
      householdId: String(res.householdId),
      fullName: res.fullName,
      dob: res.dob,
      gender: res.gender,
      cccdNumber: res.cccdNumber || '',
      relationshipWithOwner: res.relationshipWithOwner,
      residenceStatus: res.residenceStatus || 'THUONG_TRU',
    });
    setModal({ open: true, editing: res });
    setModalError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        ...form,
        householdId: Number(form.householdId),
      };
      if (modal.editing) {
        await residentApi.update(modal.editing.id, payload);
      } else {
        await residentApi.create(payload);
      }
      setModal({ open: false, editing: null });
      loadData();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể lưu thông tin nhân khẩu'));
    }
  };

  const handleDelete = async (res) => {
    if (!window.confirm(`Xác nhận xóa mềm nhân khẩu "${res.fullName}"?`)) return;
    try {
      await residentApi.remove(res.id);
      loadData();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể xóa nhân khẩu'));
    }
  };

  return (
    <div className="space-y-5 bg-white text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Quản lý Nhân khẩu (PB-005)</h1>
          <p className="text-slate-600">Quản lý thành viên hộ gia đình, CCCD/CMND (9 hoặc 12 số) & Thường trú / Tạm trú</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          <Plus className="w-4 h-4" /> Thêm nhân khẩu
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
            placeholder="Tìm theo họ tên, CCCD/CMND hoặc mã căn hộ..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded bg-white"
          />
        </div>
        <select
          value={filters.householdId}
          onChange={(e) => setFilters({ ...filters, householdId: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="">Tất cả hộ gia đình</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.apartmentCode} - {h.headName}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả cư trú</option>
          <option value="THUONG_TRU">Thường trú</option>
          <option value="TAM_TRU">Tạm trú</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-left">Căn hộ</th>
              <th className="py-2.5 px-3 text-left">Họ và tên</th>
              <th className="py-2.5 px-3 text-left">Ngày sinh</th>
              <th className="py-2.5 px-3 text-left">Giới tính</th>
              <th className="py-2.5 px-3 text-left">CCCD / CMND</th>
              <th className="py-2.5 px-3 text-left">Quan hệ chủ hộ</th>
              <th className="py-2.5 px-3 text-left">Cư trú</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {residents.map((r) => {
              const st = STATUS_LABELS[r.residenceStatus] || STATUS_LABELS.THUONG_TRU;
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-left font-semibold text-blue-700">{r.apartmentCode}</td>
                  <td className="py-2.5 px-3 text-left font-medium">{r.fullName}</td>
                  <td className="py-2.5 px-3 text-left">{r.dob}</td>
                  <td className="py-2.5 px-3 text-left">{r.gender}</td>
                  <td className="py-2.5 px-3 text-left font-mono">{r.cccdNumber || 'Chưa cấp'}</td>
                  <td className="py-2.5 px-3 text-left">{r.relationshipWithOwner}</td>
                  <td className="py-2.5 px-3 text-left">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                      {st.text}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 border border-slate-300 rounded hover:bg-slate-100"
                        title="Cập nhật nhân khẩu"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50"
                        title="Xóa mềm nhân khẩu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {residents.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Không có dữ liệu nhân khẩu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-md p-6">
            <h2 className="text-base font-bold mb-4">
              {modal.editing ? 'Cập nhật nhân khẩu' : 'Thêm nhân khẩu mới'}
            </h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Hộ gia đình</label>
                <select
                  required
                  value={form.householdId}
                  onChange={(e) => setForm({ ...form, householdId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                >
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.apartmentCode} - {h.headName}
                    </option>
                  ))}
                </select>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Giới tính</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Số CCCD / CMND (9 hoặc 12 số, để trống nếu trẻ em)</label>
                <input
                  type="text"
                  maxLength={12}
                  value={form.cccdNumber}
                  onChange={(e) => setForm({ ...form, cccdNumber: e.target.value })}
                  placeholder="001190001234 hoặc 012345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Quan hệ với chủ hộ</label>
                  <select
                    value={form.relationshipWithOwner}
                    onChange={(e) => setForm({ ...form, relationshipWithOwner: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Chủ hộ">Chủ hộ</option>
                    <option value="Vợ">Vợ</option>
                    <option value="Chồng">Chồng</option>
                    <option value="Con">Con</option>
                    <option value="Bố / Mẹ">Bố / Mẹ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Trạng thái cư trú</label>
                  <select
                    value={form.residenceStatus}
                    onChange={(e) => setForm({ ...form, residenceStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="THUONG_TRU">Thường trú</option>
                    <option value="TAM_TRU">Tạm trú</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, editing: null })}
                  className="px-4 py-2 border border-slate-300 rounded"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
                  Lưu nhân khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
