import { useCallback, useEffect, useState } from 'react';
import { Banknote, Eye, Search } from 'lucide-react';
import { invoiceApi } from '../api/invoiceApi';
import { householdApi } from '../api/householdApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { formatDateTime, formatNumber, formatVnd } from '../utils/formatters';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    billingPeriod: '',
    status: 'ALL',
    householdId: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [detailModal, setDetailModal] = useState({ open: false, invoice: null });
  const [payModal, setPayModal] = useState({ open: false, invoice: null, note: '' });
  const [payError, setPayError] = useState('');

  const loadInvoices = useCallback(async () => {
    try {
      const res = await invoiceApi.getAll(filters);
      setInvoices(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách hóa đơn'));
    }
  }, [filters]);

  useEffect(() => {
    householdApi
      .getAll({})
      .then((res) => setHouseholds(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInvoices();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadInvoices]);

  const openDetail = async (id) => {
    try {
      const res = await invoiceApi.getDetail(id);
      setDetailModal({ open: true, invoice: res.data });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải chi tiết hóa đơn'));
    }
  };

  const openPayModal = (inv) => {
    setPayModal({ open: true, invoice: inv, note: '' });
    setPayError('');
  };

  const handleConfirmCash = async (e) => {
    e.preventDefault();
    setPayError('');
    try {
      const res = await invoiceApi.payCash(payModal.invoice.id, payModal.note);
      setPayModal({ open: false, invoice: null, note: '' });
      setSuccessMsg(
        `Đã xác nhận thu tiền mặt hóa đơn ${res.data.invoiceCode} (${formatVnd(res.data.totalAmount)}) — Người thu: ${res.data.collectedByName}`
      );
      loadInvoices();
    } catch (err) {
      setPayError(getApiErrorMessage(err, 'Không thể xác nhận thanh toán'));
    }
  };

  const totalAmount = invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const paidAmount = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const unpaidAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-5 bg-white text-black">
      <div>
        <h1 className="text-lg font-bold text-black">Lọc Phiếu thu & Thu Tiền mặt tại Quầy (PB-009)</h1>
        <p className="text-slate-600">Tra cứu công nợ theo hộ/kỳ/trạng thái và xác nhận thanh toán tiền mặt (PAID)</p>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">{errorMsg}</div>}
      {successMsg && <div className="p-3 bg-green-50 border border-green-300 text-green-800 rounded">{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="text-slate-600">Tổng giá trị hóa đơn ({invoices.length})</div>
          <div className="text-lg font-bold mt-1 num-cell text-left">{formatVnd(totalAmount)}</div>
        </div>
        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="text-green-800">Đã thu (PAID)</div>
          <div className="text-lg font-bold text-green-700 mt-1">{formatVnd(paidAmount)}</div>
        </div>
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="text-red-800">Chưa thu (UNPAID)</div>
          <div className="text-lg font-bold text-red-700 mt-1">{formatVnd(unpaidAmount)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            placeholder="Tìm mã hóa đơn, mã căn hộ, tên chủ hộ..."
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
        <input
          type="month"
          value={filters.billingPeriod}
          onChange={(e) => setFilters({ ...filters, billingPeriod: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="UNPAID">Chưa thanh toán (UNPAID)</option>
          <option value="PAID">Đã thanh toán (PAID)</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-cell">Mã phiếu thu</th>
              <th className="py-2.5 px-3 text-cell">Căn hộ</th>
              <th className="py-2.5 px-3 text-cell">Chủ hộ</th>
              <th className="py-2.5 px-3 text-cell">Kỳ thu</th>
              <th className="py-2.5 px-3 num-cell">Phí dịch vụ</th>
              <th className="py-2.5 px-3 num-cell">Điện/Nước</th>
              <th className="py-2.5 px-3 num-cell">Tổng tiền (VNĐ)</th>
              <th className="py-2.5 px-3 text-cell">Trạng thái</th>
              <th className="py-2.5 px-3 text-cell">Người thu / Thời gian</th>
              <th className="py-2.5 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 text-cell font-mono">{inv.invoiceCode}</td>
                <td className="py-2.5 px-3 text-cell font-bold text-blue-700">{inv.apartmentCode}</td>
                <td className="py-2.5 px-3 text-cell">{inv.headName}</td>
                <td className="py-2.5 px-3 text-cell">{inv.billingPeriod}</td>
                <td className="py-2.5 px-3 num-cell">{formatVnd(inv.serviceFeeTotal)}</td>
                <td className="py-2.5 px-3 num-cell">{formatVnd(inv.utilityFeeTotal)}</td>
                <td className="py-2.5 px-3 num-cell font-bold">{formatVnd(inv.totalAmount)}</td>
                <td className="py-2.5 px-3 text-cell">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {inv.status === 'PAID' ? 'Đã thu (PAID)' : 'Chưa thu (UNPAID)'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-cell text-slate-600">
                  {inv.status === 'PAID' ? (
                    <div>
                      <div className="font-medium text-black">{inv.collectedByName || '—'}</div>
                      <div className="text-xs">{formatDateTime(inv.paidAt)}</div>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openDetail(inv.id)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 rounded text-xs hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>
                    {inv.status === 'UNPAID' && (
                      <button
                        onClick={() => openPayModal(inv)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                      >
                        <Banknote className="w-3.5 h-3.5" /> Thu tiền mặt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  Không có phiếu thu / hóa đơn nào phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailModal.open && detailModal.invoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-base font-bold">Chi tiết phiếu thu {detailModal.invoice.invoiceCode}</h2>
                <p className="text-slate-600">
                  Căn hộ {detailModal.invoice.apartmentCode} • {detailModal.invoice.headName} • Kỳ{' '}
                  {detailModal.invoice.billingPeriod}
                </p>
              </div>
              <button
                onClick={() => setDetailModal({ open: false, invoice: null })}
                className="px-3 py-1 border border-slate-300 rounded"
              >
                Đóng
              </button>
            </div>
            <table className="w-full border-collapse border border-slate-200">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-cell">Khoản mục</th>
                  <th className="py-2 px-3 text-cell">Loại</th>
                  <th className="py-2 px-3 num-cell">Số lượng</th>
                  <th className="py-2 px-3 text-cell">Đơn vị</th>
                  <th className="py-2 px-3 num-cell">Đơn giá</th>
                  <th className="py-2 px-3 num-cell">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(detailModal.invoice.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3 text-cell">{item.itemName}</td>
                    <td className="py-2 px-3 text-cell">{item.itemType === 'FEE' ? 'Phí cố định' : 'Tiện ích'}</td>
                    <td className="py-2 px-3 num-cell">{formatNumber(item.quantity)}</td>
                    <td className="py-2 px-3 text-cell">{item.unit}</td>
                    <td className="py-2 px-3 num-cell">{formatVnd(item.unitPrice)}</td>
                    <td className="py-2 px-3 num-cell font-medium">{formatVnd(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-300">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right font-bold">
                    Tổng cộng:
                  </td>
                  <td className="py-2.5 px-3 num-cell font-bold text-blue-700">
                    {formatVnd(detailModal.invoice.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {payModal.open && payModal.invoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-md p-6">
            <h2 className="text-base font-bold mb-2">Xác nhận thu tiền mặt tại quầy</h2>
            <p className="text-slate-600 mb-4">
              Phiếu thu <strong>{payModal.invoice.invoiceCode}</strong> — Căn hộ{' '}
              <strong>{payModal.invoice.apartmentCode}</strong> ({payModal.invoice.headName})
            </p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4 flex justify-between items-center">
              <span>Số tiền thu:</span>
              <strong className="text-lg text-blue-700">{formatVnd(payModal.invoice.totalAmount)}</strong>
            </div>
            {payError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{payError}</div>
            )}
            <form onSubmit={handleConfirmCash} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Ghi chú thu tiền (tùy chọn)</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={payModal.note}
                  onChange={(e) => setPayModal({ ...payModal, note: e.target.value })}
                  placeholder="VD: Chủ hộ đóng đủ tiền mặt tại quầy lễ tân"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModal({ open: false, invoice: null, note: '' })}
                  className="px-4 py-2 border border-slate-300 rounded"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-medium">
                  Xác nhận đã thu (PAID)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
