import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { apartmentApi } from '../api/apartmentApi';
import { getApiErrorMessage } from '../api/axiosClient';

const STATUS_BADGE = {
  AVAILABLE: { text: 'Còn trống (AVAILABLE)', cls: 'bg-green-100 text-green-800' },
  OCCUPIED: { text: 'Đang ở (OCCUPIED)', cls: 'bg-blue-100 text-blue-800' },
};

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', status: 'ALL', floor: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [modalError, setModalError] = useState('');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState({ apartmentCode: '', floor: 1, area: '' });

  const loadApartments = useCallback(async () => {
    try {
      const res = await apartmentApi.getAll(filters);
      setApartments(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách căn hộ'));
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadApartments();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadApartments]);

  const openCreate = () => {
    setForm({ apartmentCode: '', floor: 1, area: '' });
    setModal({ open: true, editing: null });
    setModalError('');
  };

  const openEdit = (apt) => {
    setForm({ apartmentCode: apt.apartmentCode, floor: apt.floor, area: apt.area });
    setModal({ open: true, editing: apt });
    setModalError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        apartmentCode: form.apartmentCode,
        floor: Number(form.floor),
        area: Number(form.area),
      };
      if (modal.editing) {
        await apartmentApi.update(modal.editing.id, payload);
      } else {
        await apartmentApi.create(payload);
      }
      setModal({ open: false, editing: null });
      loadApartments();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể lưu căn hộ'));
    }
  };

  const handleDelete = async (apt) => {
    if (!window.confirm(`Xác nhận xóa mềm căn hộ ${apt.apartmentCode}?`)) return;
    try {
      await apartmentApi.remove(apt.id);
      loadApartments();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể xóa căn hộ'));
    }
  };

  return (
    <div className="space-y-5 bg-white text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-black">Quản lý Căn hộ (PB-003)</h1>
          <p className="text-slate-600">Danh sách căn hộ, diện tích, trạng thái AVAILABLE / OCCUPIED</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          <Plus className="w-4 h-4" /> Thêm căn hộ
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
            placeholder="Tìm theo mã căn hộ (VD: P101, A1-1205)..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded bg-white"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Còn trống (AVAILABLE)</option>
          <option value="OCCUPIED">Đang ở (OCCUPIED)</option>
        </select>
        <input
          type="number"
          min={1}
          value={filters.floor}
          onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
          placeholder="Lọc theo tầng..."
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        />
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-left">Mã căn hộ</th>
              <th className="py-2.5 px-3 text-right">Tầng</th>
              <th className="py-2.5 px-3 text-right">Diện tích (m²)</th>
              <th className="py-2.5 px-3 text-left">Trạng thái</th>
              <th className="py-2.5 px-3 text-left">Chủ hộ hiện tại</th>
              <th className="py-2.5 px-3 text-right">Nhân khẩu</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {apartments.map((apt) => {
              const badge = STATUS_BADGE[apt.status] || STATUS_BADGE.AVAILABLE;
              return (
                <tr key={apt.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-left font-semibold text-blue-700">{apt.apartmentCode}</td>
                  <td className="py-2.5 px-3 num-cell">{apt.floor}</td>
                  <td className="py-2.5 px-3 num-cell">{Number(apt.area).toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-left">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-left">
                    {apt.headName ? (
                      <span>
                        {apt.headName} ({apt.headPhone})
                      </span>
                    ) : (
                      <span className="text-slate-400">Chưa có hộ</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 num-cell">{apt.residentCount ?? 0}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(apt)}
                        className="p-1.5 border border-slate-300 rounded hover:bg-slate-100"
                        title="Chỉnh sửa căn hộ"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(apt)}
                        className="p-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50"
                        title="Xóa mềm căn hộ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {apartments.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Không có dữ liệu căn hộ phù hợp
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
              {modal.editing ? 'Cập nhật căn hộ' : 'Thêm căn hộ mới'}
            </h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Mã căn hộ (duy nhất)</label>
                <input
                  type="text"
                  required
                  value={form.apartmentCode}
                  onChange={(e) => setForm({ ...form, apartmentCode: e.target.value })}
                  placeholder="A1-1205"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Tầng</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Diện tích (m² &gt; 0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder="85.5"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-right"
                  />
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
                  Lưu căn hộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
