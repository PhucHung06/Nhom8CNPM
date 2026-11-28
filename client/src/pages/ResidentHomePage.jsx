import { useEffect, useState } from 'react';
import { Building2, Eye, Receipt, Users, Zap } from 'lucide-react';
import { residentApi } from '../api/residentApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { formatDateTime, formatNumber, formatVnd } from '../utils/formatters';

const SERVICE_NAMES = {
  ELECTRICITY: 'Điện (kWh)',
  WATER: 'Nước (m³)',
  INTERNET: 'Internet',
};

export default function ResidentHomePage() {
  const [activeTab, setActiveTab] = useState('household');
  const [data, setData] = useState({ assigned: false, household: null, residents: [] });
  const [utilities, setUtilities] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [detailModal, setDetailModal] = useState({ open: false, invoice: null });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    residentApi
      .getMyHousehold()
      .then((res) => {
        if (mounted) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setErrorMsg(getApiErrorMessage(err, 'Không thể tải thông tin hộ gia đình'));
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!data.assigned) return;
    if (activeTab === 'utilities') {
      residentApi
        .getMyUtilities()
        .then((res) => setUtilities(res.data))
        .catch((err) => setErrorMsg(getApiErrorMessage(err, 'Không thể tải chỉ số điện nước')));
    } else if (activeTab === 'invoices') {
      residentApi
        .getMyInvoices()
        .then((res) => setInvoices(res.data))
        .catch((err) => setErrorMsg(getApiErrorMessage(err, 'Không thể tải danh sách hóa đơn')));
    }
  }, [activeTab, data.assigned]);

  const handleViewInvoiceDetail = async (id) => {
    try {
      const res = await residentApi.getMyInvoiceDetail(id);
      setDetailModal({ open: true, invoice: res.data });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không thể tải chi tiết hóa đơn'));
    }
  };

  return (
    <div className="space-y-5 bg-white text-black">
      <div>
        <h1 className="text-lg font-bold">Cổng Thông Tin Cư Dân</h1>
        <p className="text-slate-600">Xem thông tin hộ gia đình, chỉ số điện/nước và lịch sử hóa đơn của hộ mình</p>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">{errorMsg}</div>}

      {!data.assigned ? (
        <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
          Tài khoản của bạn hiện chưa được gắn với hộ gia đình nào. Vui lòng liên hệ Ban quản lý để được hỗ trợ Grant-access.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('household')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-medium ${activeTab === 'household' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <Users className="w-4 h-4" /> Hộ gia đình & Nhân khẩu
            </button>
            <button
              onClick={() => setActiveTab('utilities')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-medium ${activeTab === 'utilities' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <Zap className="w-4 h-4" /> Điện / Nước / Internet
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-medium ${activeTab === 'invoices' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <Receipt className="w-4 h-4" /> Hóa đơn & Thanh toán
            </button>
          </div>

          {activeTab === 'household' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Mã căn hộ
                  </div>
                  <div className="font-bold text-blue-700 mt-1">{data.household.apartmentCode}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tầng / Diện tích</div>
                  <div className="font-semibold mt-1">
                    Tầng {data.household.floor} • {Number(data.household.area).toFixed(1)} m²
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Chủ hộ</div>
                  <div className="font-semibold mt-1">{data.household.headName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Số điện thoại liên hệ</div>
                  <div className="font-semibold mt-1">{data.household.phone}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 font-bold flex items-center gap-2">
                  <Users className="w-4 h-4" /> Danh sách nhân khẩu trong hộ ({data.residents.length})
                </div>
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-cell">Họ và tên</th>
                      <th className="py-2 px-3 text-cell">Ngày sinh</th>
                      <th className="py-2 px-3 text-cell">Giới tính</th>
                      <th className="py-2 px-3 text-cell">CCCD / CMND</th>
                      <th className="py-2 px-3 text-cell">Quan hệ</th>
                      <th className="py-2 px-3 text-cell">Cư trú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.residents.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 px-3 text-cell font-medium">{r.fullName}</td>
                        <td className="py-2 px-3 text-cell">{r.dob}</td>
                        <td className="py-2 px-3 text-cell">{r.gender}</td>
                        <td className="py-2 px-3 text-cell font-mono">{r.cccdNumber || 'Chưa cấp'}</td>
                        <td className="py-2 px-3 text-cell">{r.relationshipWithOwner}</td>
                        <td className="py-2 px-3 text-cell">
                          {r.residenceStatus === 'TAM_TRU' ? 'Tạm trú' : 'Thường trú'}
                        </td>
                      </tr>
                    ))}
                    {data.residents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          Chưa có nhân khẩu được khai báo trong hộ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'utilities' && (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-cell">Kỳ thu</th>
                    <th className="py-2.5 px-3 text-cell">Dịch vụ</th>
                    <th className="py-2.5 px-3 num-cell">Chỉ số đầu</th>
                    <th className="py-2.5 px-3 num-cell">Chỉ số cuối</th>
                    <th className="py-2.5 px-3 num-cell">Tiêu thụ</th>
                    <th className="py-2.5 px-3 num-cell">Đơn giá</th>
                    <th className="py-2.5 px-3 num-cell">Thành tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {utilities.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 px-3 text-cell font-mono">{u.billingPeriod}</td>
                      <td className="py-2.5 px-3 text-cell font-medium">
                        {SERVICE_NAMES[u.serviceType] || u.serviceType}
                      </td>
                      <td className="py-2.5 px-3 num-cell">{formatNumber(u.oldIndex)}</td>
                      <td className="py-2.5 px-3 num-cell">{formatNumber(u.newIndex)}</td>
                      <td className="py-2.5 px-3 num-cell">{formatNumber(u.usageAmount)}</td>
                      <td className="py-2.5 px-3 num-cell">{formatVnd(u.unitPrice)}</td>
                      <td className="py-2.5 px-3 num-cell font-bold">{formatVnd(u.totalAmount)}</td>
                    </tr>
                  ))}
                  {utilities.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Chưa có dữ liệu điện / nước / internet cho hộ của bạn
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-cell">Mã hóa đơn</th>
                    <th className="py-2.5 px-3 text-cell">Kỳ thu</th>
                    <th className="py-2.5 px-3 text-cell">Hạn đóng</th>
                    <th className="py-2.5 px-3 num-cell">Phí dịch vụ</th>
                    <th className="py-2.5 px-3 num-cell">Điện/Nước</th>
                    <th className="py-2.5 px-3 num-cell">Tổng tiền (VNĐ)</th>
                    <th className="py-2.5 px-3 text-cell">Trạng thái</th>
                    <th className="py-2.5 px-3 text-center">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2.5 px-3 text-cell font-mono">{inv.invoiceCode}</td>
                      <td className="py-2.5 px-3 text-cell">{inv.billingPeriod}</td>
                      <td className="py-2.5 px-3 text-cell">{inv.dueDate}</td>
                      <td className="py-2.5 px-3 num-cell">{formatVnd(inv.serviceFeeTotal)}</td>
                      <td className="py-2.5 px-3 num-cell">{formatVnd(inv.utilityFeeTotal)}</td>
                      <td className="py-2.5 px-3 num-cell font-bold">{formatVnd(inv.totalAmount)}</td>
                      <td className="py-2.5 px-3 text-cell">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {inv.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleViewInvoiceDetail(inv.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-300 rounded text-xs hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Chưa có hóa đơn nào cho hộ của bạn
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {detailModal.open && detailModal.invoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-base font-bold">Chi tiết hóa đơn {detailModal.invoice.invoiceCode}</h2>
                <p className="text-slate-600">Kỳ thu {detailModal.invoice.billingPeriod}</p>
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
                    <td className="py-2 px-3 num-cell">{formatNumber(item.quantity)}</td>
                    <td className="py-2 px-3 text-cell">{item.unit}</td>
                    <td className="py-2 px-3 num-cell">{formatVnd(item.unitPrice)}</td>
                    <td className="py-2 px-3 num-cell font-medium">{formatVnd(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-300">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right font-bold">
                    Tổng cộng:
                  </td>
                  <td className="py-2.5 px-3 num-cell font-bold text-blue-700">
                    {formatVnd(detailModal.invoice.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
            {detailModal.invoice.status === 'PAID' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-800">
                Đã thanh toán ({detailModal.invoice.paymentMethod}) lúc {formatDateTime(detailModal.invoice.paidAt)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
