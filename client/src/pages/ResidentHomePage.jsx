import { useEffect, useState } from 'react';
import { Building2, Users } from 'lucide-react';
import { residentApi } from '../api/residentApi';
import { getApiErrorMessage } from '../api/axiosClient';

export default function ResidentHomePage() {
  const [data, setData] = useState({ assigned: false, household: null, residents: [] });
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

  return (
    <div className="space-y-5 bg-white text-black">
      <div>
        <h1 className="text-lg font-bold">Cổng Thông Tin Cư Dân</h1>
        <p className="text-slate-600">Xem thông tin căn hộ, hộ gia đình và danh sách thành viên</p>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">{errorMsg}</div>}

      {!data.assigned ? (
        <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
          Tài khoản của bạn hiện chưa được gắn với hộ gia đình nào. Vui lòng liên hệ Ban quản lý để được hỗ trợ Grant-access.
        </div>
      ) : (
        <div className="space-y-5">
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
                  <th className="py-2 px-3 text-left">Họ và tên</th>
                  <th className="py-2 px-3 text-left">Ngày sinh</th>
                  <th className="py-2 px-3 text-left">Giới tính</th>
                  <th className="py-2 px-3 text-left">CCCD / CMND</th>
                  <th className="py-2 px-3 text-left">Quan hệ</th>
                  <th className="py-2 px-3 text-left">Cư trú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.residents.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 px-3 text-left font-medium">{r.fullName}</td>
                    <td className="py-2 px-3 text-left">{r.dob}</td>
                    <td className="py-2 px-3 text-left">{r.gender}</td>
                    <td className="py-2 px-3 text-left font-mono">{r.cccdNumber || 'Chưa cấp'}</td>
                    <td className="py-2 px-3 text-left">{r.relationshipWithOwner}</td>
                    <td className="py-2 px-3 text-left">
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
        </div>
      )}
    </div>
  );
}
