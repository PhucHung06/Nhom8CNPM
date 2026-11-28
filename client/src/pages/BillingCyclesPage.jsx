import { useCallback, useEffect, useState } from 'react';
import { CalendarRange, Eye, Lock, Play, Plus } from 'lucide-react';
import { billingCycleApi } from '../api/billingCycleApi';
import { invoiceApi } from '../api/invoiceApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { formatDateTime, formatNumber, formatVnd, getCurrentBillingPeriod } from '../utils/formatters';

export default function BillingCyclesPage() {
  const [cycles, setCycles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [summaryMsg, setSummaryMsg] = useState('');

  const [createModal, setCreateModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState({
    cycleName: '',
    billingPeriod: getCurrentBillingPeriod(),
    dueDate: '',
  });

  const [cycleInvoicesModal, setCycleInvoicesModal] = useState({ open: false, cycle: null, invoices: [] });
  const [detailModal, setDetailModal] = useState({ open: false, invoice: null });

  const loadCycles = useCallback(async () => {
    try {
      const res = await billingCycleApi.getAll();
      setCycles(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách đợt thu'));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCycles();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCycles]);

  const openCreate = () => {
    const period = getCurrentBillingPeriod();
    setForm({
      cycleName: `Đợt thu tháng ${period.split('-')[1]}/${period.split('-')[0]}`,
      billingPeriod: period,
      dueDate: `${period}-25`,
    });
    setModalError('');
    setCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await billingCycleApi.create(form);
      setCreateModal(false);
      setSummaryMsg('Đã tạo đợt thu mới thành công');
      loadCycles();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể tạo đợt thu'));
    }
  };

  const handleGenerate = async (cycle) => {
    try {
      const res = await billingCycleApi.generateInvoices(cycle.id);
      const d = res.data;
      setSummaryMsg(
        `Kỳ ${d.billingPeriod}: Đã sinh mới ${d.createdCount} hóa đơn (bỏ qua ${d.skippedCount} hộ đã có hóa đơn). Tổng tiền sinh mới: ${formatVnd(d.totalGeneratedAmount)}.`
      );
      setErrorMsg('');
      loadCycles();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể sinh hóa đơn'));
    }
  };

  const handleCloseCycle = async (cycle) => {
    if (
      !window.confirm(
        `Xác nhận ĐÓNG đợt thu "${cycle.cycleName}" (${cycle.billingPeriod})? Sau khi đóng sẽ khóa sinh thêm hóa đơn và khóa chỉnh sửa chỉ số kỳ này.`
      )
    ) {
      return;
    }
    try {
      await billingCycleApi.close(cycle.id);
      setSummaryMsg(`Đã đóng đợt thu kỳ ${cycle.billingPeriod}`);
      loadCycles();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể đóng đợt thu'));
    }
  };

  const handleViewInvoices = async (cycle) => {
    try {
      const res = await billingCycleApi.getInvoices(cycle.id);
      setCycleInvoicesModal({ open: true, cycle, invoices: res.data });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách hóa đơn của đợt thu'));
    }
  };

  const handleViewInvoiceDetail = async (invoiceId) => {
    try {
      const res = await invoiceApi.getDetail(invoiceId);
      setDetailModal({ open: true, invoice: res.data });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải chi tiết hóa đơn'));
    }
  };

  return (
    <div className="space-y-5 bg-white text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-black">Lập Đợt thu & Sinh Hóa đơn Định kỳ (PB-008)</h1>
          <p className="text-slate-600">Tự động tính phí Bắt buộc + Điện/Nước/Internet cho mọi hộ ACTIVE (Idempotent)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          <Plus className="w-4 h-4" /> Lập đợt thu mới
        </button>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">{errorMsg}</div>}
      {summaryMsg && <div className="p-3 bg-green-50 border border-green-300 text-green-800 rounded">{summaryMsg}</div>}

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-cell">Tên đợt thu</th>
              <th className="py-2.5 px-3 text-cell">Kỳ thu</th>
              <th className="py-2.5 px-3 text-cell">Hạn đóng</th>
              <th className="py-2.5 px-3 text-cell">Trạng thái</th>
              <th className="py-2.5 px-3 num-cell">Số hóa đơn</th>
              <th className="py-2.5 px-3 num-cell">Đã thu / Tổng</th>
              <th className="py-2.5 px-3 num-cell">Tổng tiền (VNĐ)</th>
              <th className="py-2.5 px-3 num-cell">Đã thu (VNĐ)</th>
              <th className="py-2.5 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {cycles.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 text-cell font-semibold">{c.cycleName}</td>
                <td className="py-2.5 px-3 text-cell font-mono">{c.billingPeriod}</td>
                <td className="py-2.5 px-3 text-cell">{c.dueDate}</td>
                <td className="py-2.5 px-3 text-cell">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {c.status === 'OPEN' ? 'Đang mở (OPEN)' : 'Đã đóng (CLOSED)'}
                  </span>
                </td>
                <td className="py-2.5 px-3 num-cell">{c.invoiceCount}</td>
                <td className="py-2.5 px-3 num-cell">
                  {c.paidCount} / {c.invoiceCount}
                </td>
                <td className="py-2.5 px-3 num-cell font-bold">{formatVnd(c.totalAmount)}</td>
                <td className="py-2.5 px-3 num-cell text-green-700 font-medium">{formatVnd(c.paidAmount)}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center justify-center gap-1.5">
                    {c.status === 'OPEN' && (
                      <>
                        <button
                          onClick={() => handleGenerate(c)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                          title="Sinh hóa đơn tự động cho hộ ACTIVE"
                        >
                          <Play className="w-3 h-3" /> Sinh hóa đơn
                        </button>
                        <button
                          onClick={() => handleCloseCycle(c)}
                          className="flex items-center gap-1 px-2.5 py-1 border border-amber-300 text-amber-800 hover:bg-amber-50 rounded text-xs font-medium"
                          title="Đóng đợt thu"
                        >
                          <Lock className="w-3 h-3" /> Đóng
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewInvoices(c)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 hover:bg-slate-100 rounded text-xs font-medium"
                      title="Xem danh sách hóa đơn"
                    >
                      <Eye className="w-3 h-3" /> Hóa đơn
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {cycles.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  Chưa có đợt thu nào được tạo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-md p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-blue-600" /> Lập đợt thu mới
            </h2>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">{modalError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Tên đợt thu</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.cycleName}
                  onChange={(e) => setForm({ ...form, cycleName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
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
                  <label className="block font-medium mb-1">Hạn thanh toán</label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
                  Tạo đợt thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cycleInvoicesModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold">
                Hóa đơn đợt {cycleInvoicesModal.cycle?.cycleName} ({cycleInvoicesModal.cycle?.billingPeriod})
              </h2>
              <button
                onClick={() => setCycleInvoicesModal({ open: false, cycle: null, invoices: [] })}
                className="px-3 py-1 border border-slate-300 rounded"
              >
                Đóng
              </button>
            </div>
            <div className="border border-slate-200 rounded overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-cell">Mã HĐ</th>
                    <th className="py-2 px-3 text-cell">Căn hộ</th>
                    <th className="py-2 px-3 text-cell">Chủ hộ</th>
                    <th className="py-2 px-3 num-cell">Phí DV</th>
                    <th className="py-2 px-3 num-cell">Điện/Nước</th>
                    <th className="py-2 px-3 num-cell">Tổng cộng</th>
                    <th className="py-2 px-3 text-cell">Trạng thái</th>
                    <th className="py-2 px-3 text-center">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cycleInvoicesModal.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-cell font-mono">{inv.invoiceCode}</td>
                      <td className="py-2 px-3 text-cell font-bold text-blue-700">{inv.apartmentCode}</td>
                      <td className="py-2 px-3 text-cell">{inv.headName}</td>
                      <td className="py-2 px-3 num-cell">{formatVnd(inv.serviceFeeTotal)}</td>
                      <td className="py-2 px-3 num-cell">{formatVnd(inv.utilityFeeTotal)}</td>
                      <td className="py-2 px-3 num-cell font-bold">{formatVnd(inv.totalAmount)}</td>
                      <td className="py-2 px-3 text-cell">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {inv.status === 'PAID' ? 'Đã đóng' : 'Chưa đóng'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleViewInvoiceDetail(inv.id)}
                          className="px-2.5 py-1 border border-slate-300 rounded text-xs hover:bg-slate-100"
                        >
                          Xem khoản
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cycleInvoicesModal.invoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">
                        Chưa có hóa đơn nào được sinh trong đợt này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {detailModal.open && detailModal.invoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-base font-bold">Chi tiết hóa đơn {detailModal.invoice.invoiceCode}</h2>
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
                    Tổng cộng phải thu:
                  </td>
                  <td className="py-2.5 px-3 num-cell font-bold text-blue-700">
                    {formatVnd(detailModal.invoice.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
            {detailModal.invoice.status === 'PAID' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-800">
                Đã thanh toán ({detailModal.invoice.paymentMethod}) lúc {formatDateTime(detailModal.invoice.paidAt)} —
                Người thu: <strong>{detailModal.invoice.collectedByName || '—'}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
