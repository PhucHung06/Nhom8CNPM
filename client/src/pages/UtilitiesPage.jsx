import { useCallback, useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { utilityApi } from '../api/utilityApi';
import { householdApi } from '../api/householdApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { formatNumber, formatVnd, getCurrentBillingPeriod } from '../utils/formatters';

const SERVICE_LABELS = {
  ELECTRICITY: { text: 'Điện (kWh)', cls: 'bg-amber-100 text-amber-800' },
  WATER: { text: 'Nước (m³)', cls: 'bg-sky-100 text-sky-800' },
  INTERNET: { text: 'Internet (tháng)', cls: 'bg-indigo-100 text-indigo-800' },
};

export default function UtilitiesPage() {
  const [readings, setReadings] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [filters, setFilters] = useState({
    billingPeriod: getCurrentBillingPeriod(),
    serviceType: 'ALL',
    keyword: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [modal, setModal] = useState({ open: false, editing: null });
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState({
    householdId: '',
    billingPeriod: getCurrentBillingPeriod(),
    serviceType: 'ELECTRICITY',
    oldIndex: 0,
    newIndex: 0,
    unitPrice: 3500,
  });

  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [rowErrors, setRowErrors] = useState([]);

  const loadReadings = useCallback(async () => {
    try {
      const res = await utilityApi.getAll(filters);
      setReadings(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách chỉ số tiện ích'));
    }
  }, [filters]);

  useEffect(() => {
    householdApi
      .getAll({ status: 'ACTIVE' })
      .then((res) => setHouseholds(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReadings();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadReadings]);

  const handleDownloadTemplate = async () => {
    try {
      const res = await utilityApi.downloadTemplate(filters.billingPeriod || getCurrentBillingPeriod());
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mau-chi-so-dien-nuoc-${filters.billingPeriod || getCurrentBillingPeriod()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải tệp mẫu Excel'));
    }
  };

  const openCreate = () => {
    setForm({
      householdId: households[0]?.id || '',
      billingPeriod: filters.billingPeriod || getCurrentBillingPeriod(),
      serviceType: 'ELECTRICITY',
      oldIndex: 0,
      newIndex: 0,
      unitPrice: 3500,
    });
    setModal({ open: true, editing: null });
    setModalError('');
  };

  const openEdit = (r) => {
    setForm({
      householdId: r.householdId,
      billingPeriod: r.billingPeriod,
      serviceType: r.serviceType,
      oldIndex: r.oldIndex,
      newIndex: r.newIndex,
      unitPrice: r.unitPrice,
    });
    setModal({ open: true, editing: r });
    setModalError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        householdId: Number(form.householdId),
        billingPeriod: form.billingPeriod,
        serviceType: form.serviceType,
        oldIndex: Number(form.oldIndex),
        newIndex: Number(form.newIndex),
        unitPrice: Number(form.unitPrice),
      };
      if (modal.editing) {
        await utilityApi.update(modal.editing.id, payload);
      } else {
        await utilityApi.create(payload);
      }
      setModal({ open: false, editing: null });
      setSuccessMsg('Đã lưu chỉ số tiện ích thành công');
      loadReadings();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể lưu chỉ số'));
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Xóa mềm chỉ số ${r.serviceType} kỳ ${r.billingPeriod} của căn hộ ${r.apartmentCode}?`)) return;
    try {
      await utilityApi.remove(r.id);
      loadReadings();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể xóa chỉ số'));
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Vui lòng chọn tệp Excel (.xlsx)');
      return;
    }
    setImporting(true);
    setImportError('');
    setRowErrors([]);
    try {
      const res = await utilityApi.importExcel(importFile);
      setImportModal(false);
      setImportFile(null);
      setSuccessMsg(`Import thành công ${res.data.importedCount} bản ghi chỉ số!`);
      loadReadings();
    } catch (err) {
      const data = err?.response?.data;
      setImportError(getApiErrorMessage(err, 'Import Excel thất bại'));
      if (Array.isArray(data?.rowErrors)) {
        setRowErrors(data.rowErrors);
      }
    } finally {
      setImporting(false);
    }
  };

  const previewUsage =
    form.serviceType === 'INTERNET' && Number(form.newIndex) === 0 && Number(form.oldIndex) === 0
      ? 1
      : Math.max(0, Number(form.newIndex) - Number(form.oldIndex));
  const previewTotal = previewUsage * Number(form.unitPrice || 0);

  return (
    <div className="space-y-5 bg-white text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-black">Quản lý Điện / Nước / Internet (PB-007)</h1>
          <p className="text-slate-600">Ghi nhận chỉ số định kỳ, tải mẫu Excel và Import hàng loạt (all-or-nothing)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 rounded font-medium"
          >
            <Download className="w-4 h-4" /> Tải file mẫu (.xlsx)
          </button>
          <button
            onClick={() => {
              setImportModal(true);
              setImportError('');
              setRowErrors([]);
              setImportFile(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            <Plus className="w-4 h-4" /> Nhập chỉ số
          </button>
        </div>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">{errorMsg}</div>}
      {successMsg && <div className="p-3 bg-green-50 border border-green-300 text-green-800 rounded">{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            placeholder="Tìm theo mã căn hộ hoặc tên chủ hộ..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded bg-white"
          />
        </div>
        <input
          type="month"
          value={filters.billingPeriod}
          onChange={(e) => setFilters({ ...filters, billingPeriod: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        />
        <select
          value={filters.serviceType}
          onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả dịch vụ</option>
          <option value="ELECTRICITY">Điện (ELECTRICITY)</option>
          <option value="WATER">Nước (WATER)</option>
          <option value="INTERNET">Internet (INTERNET)</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-cell">Căn hộ</th>
              <th className="py-2.5 px-3 text-cell">Chủ hộ</th>
              <th className="py-2.5 px-3 text-cell">Kỳ thu</th>
              <th className="py-2.5 px-3 text-cell">Dịch vụ</th>
              <th className="py-2.5 px-3 num-cell">Chỉ số đầu</th>
              <th className="py-2.5 px-3 num-cell">Chỉ số cuối</th>
              <th className="py-2.5 px-3 num-cell">Tiêu thụ</th>
              <th className="py-2.5 px-3 num-cell">Đơn giá</th>
              <th className="py-2.5 px-3 num-cell">Thành tiền (VNĐ)</th>
              <th className="py-2.5 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {readings.map((r) => {
              const badge = SERVICE_LABELS[r.serviceType] || {
                text: r.serviceType,
                cls: 'bg-slate-100 text-slate-700',
              };
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-cell font-bold text-blue-700">{r.apartmentCode}</td>
                  <td className="py-2.5 px-3 text-cell">{r.headName}</td>
                  <td className="py-2.5 px-3 text-cell">{r.billingPeriod}</td>
                  <td className="py-2.5 px-3 text-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>{badge.text}</span>
                  </td>
                  <td className="py-2.5 px-3 num-cell">{formatNumber(r.oldIndex)}</td>
                  <td className="py-2.5 px-3 num-cell">{formatNumber(r.newIndex)}</td>
                  <td className="py-2.5 px-3 num-cell font-medium">{formatNumber(r.usageAmount)}</td>
                  <td className="py-2.5 px-3 num-cell">{formatVnd(r.unitPrice)}</td>
                  <td className="py-2.5 px-3 num-cell font-bold">{formatVnd(r.totalAmount)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 border border-slate-300 rounded hover:bg-slate-100"
                        title="Sửa chỉ số"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
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
            {readings.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  Chưa có dữ liệu chỉ số tiện ích phù hợp
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
              {modal.editing ? 'Cập nhật chỉ số tiện ích' : 'Ghi nhận chỉ số tiện ích'}
            </h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Hộ gia đình (đang ở)</label>
                <select
                  required
                  value={form.householdId}
                  onChange={(e) => setForm({ ...form, householdId: e.target.value })}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Kỳ thu (YYYY-MM)</label>
                  <input
                    type="month"
                    required
                    value={form.billingPeriod}
                    onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Loại dịch vụ</label>
                  <select
                    value={form.serviceType}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      const defaultPrice = nextType === 'ELECTRICITY' ? 3500 : nextType === 'WATER' ? 15000 : 200000;
                      setForm({ ...form, serviceType: nextType, unitPrice: defaultPrice });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="ELECTRICITY">Điện</option>
                    <option value="WATER">Nước</option>
                    <option value="INTERNET">Internet</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">Chỉ số đầu</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.oldIndex}
                    onChange={(e) => setForm({ ...form, oldIndex: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Chỉ số cuối</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.newIndex}
                    onChange={(e) => setForm({ ...form, newIndex: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Đơn giá (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step="100"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-right"
                  />
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between">
                <span>Tiêu thụ dự kiến: <strong>{formatNumber(previewUsage)}</strong></span>
                <span>Thành tiền: <strong className="text-blue-700">{formatVnd(previewTotal)}</strong></span>
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
                  Lưu chỉ số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Import chỉ số Điện / Nước / Internet từ Excel
            </h2>
            <p className="text-slate-600 mb-4">
              Hệ thống kiểm tra toàn bộ dòng trước khi lưu. Nếu có bất kỳ dòng nào sai, toàn bộ file sẽ bị từ chối (rollback).
            </p>
            {importError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{importError}</div>
            )}

            {rowErrors.length > 0 && (
              <div className="mb-4 border border-red-200 rounded overflow-x-auto max-h-60">
                <table className="w-full border-collapse">
                  <thead className="bg-red-50 border-b border-red-200">
                    <tr>
                      <th className="py-2 px-3 num-cell">Dòng</th>
                      <th className="py-2 px-3 text-cell">Căn hộ</th>
                      <th className="py-2 px-3 text-cell">Dịch vụ</th>
                      <th className="py-2 px-3 text-cell">Lỗi chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {rowErrors.map((err, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 num-cell font-bold">{err.rowNumber}</td>
                        <td className="py-1.5 px-3 text-cell">{err.apartmentCode || '—'}</td>
                        <td className="py-1.5 px-3 text-cell">{err.serviceType || '—'}</td>
                        <td className="py-1.5 px-3 text-cell text-red-700">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full p-2 border border-slate-300 rounded"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded font-medium"
                >
                  {importing ? 'Đang xử lý...' : 'Tải lên & Kiểm tra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
