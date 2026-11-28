import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { feeApi } from '../api/feeApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { formatVnd } from '../utils/formatters';

const FEE_TYPE_LABELS = {
  MANDATORY: { text: 'Bắt buộc', cls: 'bg-blue-100 text-blue-800' },
  VOLUNTARY: { text: 'Tự nguyện', cls: 'bg-amber-100 text-amber-800' },
};

const UNIT_LABELS = {
  M2: 'Theo m² (M2)',
  PERSON: 'Theo nhân khẩu (PERSON)',
  HOUSEHOLD: 'Theo hộ (HOUSEHOLD)',
};

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', feeType: 'ALL', isActive: 'ALL' });
  const [errorMsg, setErrorMsg] = useState('');
  const [modalError, setModalError] = useState('');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState({
    feeName: '',
    feeType: 'MANDATORY',
    unitPrice: '',
    unit: 'M2',
    description: '',
    isActive: true,
  });

  const loadFees = useCallback(async () => {
    try {
      const res = await feeApi.getAll(filters);
      setFees(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh mục khoản thu'));
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFees();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadFees]);

  const openCreate = () => {
    setForm({
      feeName: '',
      feeType: 'MANDATORY',
      unitPrice: '',
      unit: 'M2',
      description: '',
      isActive: true,
    });
    setModal({ open: true, editing: null });
    setModalError('');
  };

  const openEdit = (fee) => {
    setForm({
      feeName: fee.feeName,
      feeType: fee.feeType,
      unitPrice: fee.unitPrice,
      unit: fee.unit,
      description: fee.description || '',
      isActive: fee.isActive,
    });
    setModal({ open: true, editing: fee });
    setModalError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        feeName: form.feeName,
        feeType: form.feeType,
        unitPrice: Number(form.unitPrice),
        unit: form.unit,
        description: form.description,
        isActive: Boolean(form.isActive),
      };
      if (modal.editing) {
        await feeApi.update(modal.editing.id, payload);
      } else {
        await feeApi.create(payload);
      }
      setModal({ open: false, editing: null });
      loadFees();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể lưu khoản thu'));
    }
  };

  const handleDelete = async (fee) => {
    if (!window.confirm(`Xác nhận xóa mềm khoản thu "${fee.feeName}"?`)) return;
    try {
      await feeApi.remove(fee.id);
      loadFees();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể xóa khoản thu'));
    }
  };

  return (
    <div className="space-y-5 bg-white text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-black">Quản lý Khoản thu (PB-006)</h1>
          <p className="text-slate-600">Danh mục phí bắt buộc / tự nguyện, đơn giá VNĐ và đơn vị tính</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          <Plus className="w-4 h-4" /> Thêm khoản thu
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
            placeholder="Tìm theo tên khoản thu hoặc mô tả..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded bg-white"
          />
        </div>
        <select
          value={filters.feeType}
          onChange={(e) => setFilters({ ...filters, feeType: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả loại phí</option>
          <option value="MANDATORY">Bắt buộc (MANDATORY)</option>
          <option value="VOLUNTARY">Tự nguyện (VOLUNTARY)</option>
        </select>
        <select
          value={filters.isActive}
          onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="true">Đang áp dụng</option>
          <option value="false">Tạm ngưng</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-cell">Tên khoản thu</th>
              <th className="py-2.5 px-3 text-cell">Loại phí</th>
              <th className="py-2.5 px-3 text-cell">Đơn vị tính</th>
              <th className="py-2.5 px-3 num-cell">Đơn giá (VNĐ)</th>
              <th className="py-2.5 px-3 text-cell">Trạng thái</th>
              <th className="py-2.5 px-3 text-cell">Mô tả</th>
              <th className="py-2.5 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {fees.map((fee) => {
              const typeBadge = FEE_TYPE_LABELS[fee.feeType] || {
                text: fee.feeType,
                cls: 'bg-slate-100 text-slate-700',
              };
              return (
                <tr key={fee.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-cell font-semibold">{fee.feeName}</td>
                  <td className="py-2.5 px-3 text-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadge.cls}`}>
                      {typeBadge.text}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-cell">{UNIT_LABELS[fee.unit] || fee.unit}</td>
                  <td className="py-2.5 px-3 num-cell font-medium">{formatVnd(fee.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-cell">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        fee.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {fee.isActive ? 'Đang áp dụng' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-cell text-slate-600">{fee.description || '—'}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(fee)}
                        className="p-1.5 border border-slate-300 rounded hover:bg-slate-100"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fee)}
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
            {fees.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Không có khoản thu nào phù hợp
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
              {modal.editing ? 'Cập nhật khoản thu' : 'Thêm khoản thu mới'}
            </h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Tên khoản thu (duy nhất)</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.feeName}
                  onChange={(e) => setForm({ ...form, feeName: e.target.value })}
                  placeholder="VD: Phí gửi xe máy"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Loại phí</label>
                  <select
                    value={form.feeType}
                    onChange={(e) => setForm({ ...form, feeType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="MANDATORY">Bắt buộc</option>
                    <option value="VOLUNTARY">Tự nguyện</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Đơn vị tính</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="M2">Theo m² (M2)</option>
                    <option value="PERSON">Theo người (PERSON)</option>
                    <option value="HOUSEHOLD">Theo hộ (HOUSEHOLD)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Đơn giá (VNĐ ≥ 0)</label>
                <input
                  type="number"
                  min={0}
                  step="100"
                  required
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  placeholder="12000"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-right"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <span>Đang áp dụng (tự động đưa vào đợt thu nếu là phí Bắt buộc)</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, editing: null })}
                  className="px-4 py-2 border border-slate-300 rounded"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
                  Lưu khoản thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
