import { useEffect, useState } from 'react';
import { CalendarClock, FileText, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const STATUS_LABELS = {
  THUONG_TRU: { text: 'Thường trú', cls: 'bg-green-100 text-green-800' },
  TAM_TRU: { text: 'Tạm trú', cls: 'bg-amber-100 text-amber-800' },
  TAM_VANG: { text: 'Tạm vắng', cls: 'bg-slate-200 text-slate-800' },
};

export default function Apartments() {
  const [apartments, setApartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedApt, setSelectedApt] = useState(null);
  const [residents, setResidents] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [modalError, setModalError] = useState('');

  const [aptModal, setAptModal] = useState({ open: false, editing: null });
  const [aptForm, setAptForm] = useState({
    apartmentCode: '',
    floor: 1,
    area: '',
    ownerName: '',
    ownerPhone: '',
  });

  const [resModalOpen, setResModalOpen] = useState(false);
  const [resForm, setResForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Nam',
    cccdNumber: '',
    relationshipWithOwner: 'Chủ hộ',
  });

  const [logModal, setLogModal] = useState({ open: false, resident: null, logs: [] });
  const [logForm, setLogForm] = useState({
    logType: 'TAM_TRU',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchApartments = async () => {
    try {
      const res = await axiosClient.get('/apartments');
      setApartments(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi tải danh sách căn hộ');
    }
  };

  const fetchResidents = async (aptId) => {
    try {
      const res = await axiosClient.get(`/residents/apartment/${aptId}`);
      setResidents(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi tải nhân khẩu');
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  const handleSelectApartment = (apt) => {
    setSelectedApt(apt);
    setErrorMsg('');
    fetchResidents(apt.id);
  };

  const openCreateApt = () => {
    setAptForm({ apartmentCode: '', floor: 1, area: '', ownerName: '', ownerPhone: '' });
    setAptModal({ open: true, editing: null });
    setModalError('');
  };

  const openEditApt = (apt, e) => {
    e.stopPropagation();
    setAptForm({
      apartmentCode: apt.apartmentCode,
      floor: apt.floor,
      area: apt.area,
      ownerName: apt.ownerName,
      ownerPhone: apt.ownerPhone,
    });
    setAptModal({ open: true, editing: apt });
    setModalError('');
  };

  const handleSaveApt = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        ...aptForm,
        floor: Number(aptForm.floor),
        area: Number(aptForm.area),
      };
      if (aptModal.editing) {
        await axiosClient.put(`/apartments/${aptModal.editing.id}`, payload);
      } else {
        await axiosClient.post('/apartments', payload);
      }
      setAptModal({ open: false, editing: null });
      fetchApartments();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Không thể lưu thông tin căn hộ');
    }
  };

  const handleAddResident = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await axiosClient.post('/residents', {
        ...resForm,
        apartmentId: selectedApt.id,
      });
      setResModalOpen(false);
      setResForm({ fullName: '', dob: '', gender: 'Nam', cccdNumber: '', relationshipWithOwner: 'Con' });
      fetchResidents(selectedApt.id);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Không thể thêm nhân khẩu');
    }
  };

  const handleDeactivateResident = async (resId) => {
    if (!window.confirm('Xác nhận cập nhật nhân khẩu này đã chuyển đi?')) return;
    try {
      await axiosClient.delete(`/residents/${resId}`);
      fetchResidents(selectedApt.id);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi cập nhật nhân khẩu');
    }
  };

  const openResidencyModal = async (resident) => {
    setModalError('');
    setLogForm({ logType: 'TAM_TRU', startDate: '', endDate: '', reason: '' });
    try {
      const res = await axiosClient.get(`/residents/${resident.id}/residency-logs`);
      setLogModal({ open: true, resident, logs: res.data });
    } catch {
      setLogModal({ open: true, resident, logs: [] });
    }
  };

  const handleSaveResidencyLog = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await axiosClient.post('/residents/residency-log', {
        residentId: logModal.resident.id,
        ...logForm,
      });
      const updatedLogs = await axiosClient.get(`/residents/${logModal.resident.id}/residency-logs`);
      setLogModal((prev) => ({ ...prev, logs: updatedLogs.data }));
      setLogForm({ logType: 'TAM_TRU', startDate: '', endDate: '', reason: '' });
      fetchResidents(selectedApt.id);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Lỗi ghi nhận tạm trú / tạm vắng');
    }
  };

  const filteredApartments = apartments.filter(
    (a) =>
      a.apartmentCode.toLowerCase().includes(search.toLowerCase()) ||
      a.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản lý Căn hộ & Nhân khẩu</h1>
          <p className="text-sm text-slate-500">Danh sách hộ gia đình, thông tin cư dân và biến động tạm trú / tạm vắng</p>
        </div>
        <button
          onClick={openCreateApt}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded"
        >
          <Plus className="w-4 h-4" /> Thêm căn hộ
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã căn hộ hoặc tên chủ hộ..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5 whitespace-nowrap">Mã căn</th>
                  <th className="py-2 px-2.5">Chủ hộ</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Diện tích</th>
                  <th className="py-2 px-2.5 text-right whitespace-nowrap">Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApartments.map((apt) => (
                  <tr
                    key={apt.id}
                    onClick={() => handleSelectApartment(apt)}
                    className={`cursor-pointer hover:bg-slate-50 transition ${selectedApt?.id === apt.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="py-2.5 px-2.5 font-semibold text-blue-700 whitespace-nowrap">{apt.apartmentCode}</td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-800 truncate max-w-[130px]">{apt.ownerName}</div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">{apt.ownerPhone}</div>
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">{apt.area} m²</td>
                    <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => openEditApt(apt, e)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded"
                        title="Chỉnh sửa căn hộ"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApartments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Chưa có dữ liệu căn hộ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4">
          {!selectedApt ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <Users className="w-8 h-8 mb-2" />
              Chọn một căn hộ bên trái để xem và quản lý danh sách nhân khẩu
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">
                      Nhân khẩu căn hộ {selectedApt.apartmentCode}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium whitespace-nowrap">
                      Tầng {selectedApt.floor} • {selectedApt.area} m²
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Chủ hộ: {selectedApt.ownerName} • SĐT: {selectedApt.ownerPhone}</p>
                </div>
                <button
                  onClick={() => { setModalError(''); setResModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm nhân khẩu
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3 whitespace-nowrap">CCCD (12 số)</th>
                      <th className="py-2 px-3 whitespace-nowrap">Quan hệ</th>
                      <th className="py-2 px-3 whitespace-nowrap">Trạng thái</th>
                      <th className="py-2 px-3 text-right whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {residents.map((res) => {
                      const st = STATUS_LABELS[res.residenceStatus] || STATUS_LABELS.THUONG_TRU;
                      return (
                        <tr key={res.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800 whitespace-nowrap">{res.fullName}</div>
                            <div className="text-xs text-slate-500 whitespace-nowrap">{res.gender} • {res.dob}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">{res.cccdNumber || 'Chưa cấp'}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{res.relationshipWithOwner}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${st.cls}`}>
                              {st.text}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openResidencyModal(res)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-slate-300 hover:bg-slate-100 rounded text-slate-700 whitespace-nowrap"
                                title="Tạm trú / Tạm vắng"
                              >
                                <CalendarClock className="w-3.5 h-3.5" /> Biến động
                              </button>
                              <button
                                onClick={() => handleDeactivateResident(res.id)}
                                className="inline-flex items-center p-1 text-xs border border-red-200 hover:bg-red-50 rounded text-red-600"
                                title="Chuyển đi"
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
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Căn hộ chưa có nhân khẩu nào được khai báo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {aptModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {aptModal.editing ? 'Cập nhật thông tin căn hộ' : 'Thêm căn hộ mới'}
            </h3>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {modalError}
              </div>
            )}
            <form onSubmit={handleSaveApt} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mã căn hộ</label>
                  <input
                    type="text"
                    required
                    value={aptForm.apartmentCode}
                    onChange={(e) => setAptForm({ ...aptForm, apartmentCode: e.target.value })}
                    placeholder="A1-1205"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tầng</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={aptForm.floor}
                    onChange={(e) => setAptForm({ ...aptForm, floor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Diện tích (m² &gt; 0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={aptForm.area}
                  onChange={(e) => setAptForm({ ...aptForm, area: e.target.value })}
                  placeholder="85.5"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Họ tên chủ hộ</label>
                <input
                  type="text"
                  required
                  value={aptForm.ownerName}
                  onChange={(e) => setAptForm({ ...aptForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Số điện thoại chủ hộ</label>
                <input
                  type="text"
                  required
                  value={aptForm.ownerPhone}
                  onChange={(e) => setAptForm({ ...aptForm, ownerPhone: e.target.value })}
                  placeholder="0987654321"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAptModal({ open: false, editing: null })}
                  className="px-4 py-2 text-sm border border-slate-300 rounded text-slate-700"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded font-medium">
                  Lưu căn hộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Thêm nhân khẩu vào căn {selectedApt?.apartmentCode}
            </h3>
            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {modalError}
              </div>
            )}
            <form onSubmit={handleAddResident} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={resForm.fullName}
                  onChange={(e) => setResForm({ ...resForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    required
                    value={resForm.dob}
                    onChange={(e) => setResForm({ ...resForm, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={resForm.gender}
                    onChange={(e) => setResForm({ ...resForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Số CCCD (12 chữ số, để trống nếu trẻ em)</label>
                <input
                  type="text"
                  maxLength={12}
                  value={resForm.cccdNumber}
                  onChange={(e) => setResForm({ ...resForm, cccdNumber: e.target.value })}
                  placeholder="001190001234"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quan hệ với chủ hộ</label>
                <select
                  value={resForm.relationshipWithOwner}
                  onChange={(e) => setResForm({ ...resForm, relationshipWithOwner: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white"
                >
                  <option value="Chủ hộ">Chủ hộ</option>
                  <option value="Vợ">Vợ</option>
                  <option value="Chồng">Chồng</option>
                  <option value="Con">Con</option>
                  <option value="Bố / Mẹ">Bố / Mẹ</option>
                  <option value="Người thuê nhà">Người thuê nhà</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResModalOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-300 rounded text-slate-700"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white rounded font-medium">
                  Lưu nhân khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {logModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Biến động cư trú: {logModal.resident?.fullName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Khai báo tạm trú, tạm vắng hoặc quay lại thường trú</p>

            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveResidencyLog} className="space-y-3 border-b border-slate-200 pb-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Loại biến động</label>
                <select
                  value={logForm.logType}
                  onChange={(e) => setLogForm({ ...logForm, logType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white"
                >
                  <option value="TAM_TRU">Tạm trú</option>
                  <option value="TAM_VANG">Tạm vắng</option>
                  <option value="THUONG_TRU">Thường trú</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    required
                    value={logForm.startDate}
                    onChange={(e) => setLogForm({ ...logForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    required
                    value={logForm.endDate}
                    onChange={(e) => setLogForm({ ...logForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Lý do / Ghi chú</label>
                <input
                  type="text"
                  value={logForm.reason}
                  onChange={(e) => setLogForm({ ...logForm, reason: e.target.value })}
                  placeholder="Công tác ngắn hạn / Sinh viên thuê trọ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLogModal({ open: false, resident: null, logs: [] })}
                  className="px-4 py-2 text-sm border border-slate-300 rounded text-slate-700"
                >
                  Đóng
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded font-medium">
                  Ghi nhận
                </button>
              </div>
            </form>

            <div>
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Lịch sử khai báo gần đây
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {logModal.logs.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                    <div className="font-semibold text-slate-800">
                      {STATUS_LABELS[item.logType]?.text || item.logType} ({item.startDate} → {item.endDate})
                    </div>
                    {item.reason && <div className="text-slate-600 mt-0.5">Lý do: {item.reason}</div>}
                  </div>
                ))}
                {logModal.logs.length === 0 && (
                  <div className="text-xs text-slate-400">Chưa có lịch sử biến động cư trú</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
