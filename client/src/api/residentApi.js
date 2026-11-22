// FILE: client/src/api/residentApi.js
// Khi có API thật, import axiosClient của nhóm (kiểm tra tên file trong src/api/):
// import axiosClient from './axiosClient';

let mockResidents = [
  {
    id: 1,
    fullName: 'Nguyễn Văn An',
    dateOfBirth: '1985-04-12',
    gender: 'MALE',
    cccd: '001085012345',
    phone: '0912345678',
    apartmentCode: 'A1-1205',
    relationshipToOwner: 'Chủ hộ',
    residencyStatus: 'PERMANENT',
  },
  {
    id: 2,
    fullName: 'Trần Thị Bình',
    dateOfBirth: '1988-09-20',
    gender: 'FEMALE',
    cccd: '001188054321',
    phone: '0987654321',
    apartmentCode: 'A1-1205',
    relationshipToOwner: 'Vợ',
    residencyStatus: 'PERMANENT',
  },
  {
    id: 3,
    fullName: 'Lê Hoàng Nam',
    dateOfBirth: '2002-11-05',
    gender: 'MALE',
    cccd: '034202009876',
    phone: '0904112233',
    apartmentCode: 'B2-0802',
    relationshipToOwner: 'Khách thuê',
    residencyStatus: 'TEMPORARY_RESIDENCE',
  },
  {
    id: 4,
    fullName: 'Phạm Minh Tuấn',
    dateOfBirth: '1995-02-14',
    gender: 'MALE',
    cccd: '001095007788',
    phone: '0933445566',
    apartmentCode: 'A1-0604',
    relationshipToOwner: 'Con',
    residencyStatus: 'TEMPORARY_ABSENCE',
  },
];

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const residentApi = {
  getAll: async (filters = {}) => {
    // API thật:
    // return axiosClient.get('/api/v1/residents', { params: filters });

    await delay();
    const kw = (filters.keyword || '').trim().toLowerCase();
    const status = filters.status || 'ALL';
    const aptCode = (filters.apartmentCode || '').trim().toLowerCase();

    const filtered = mockResidents.filter((r) => {
      const matchKw =
        !kw ||
        r.fullName.toLowerCase().includes(kw) ||
        (r.cccd && r.cccd.toLowerCase().includes(kw)) ||
        (r.phone && r.phone.toLowerCase().includes(kw)) ||
        r.apartmentCode.toLowerCase().includes(kw);

      const matchStatus = status === 'ALL' || r.residencyStatus === status;
      const matchApt = !aptCode || r.apartmentCode.toLowerCase().includes(aptCode);

      return matchKw && matchStatus && matchApt;
    });

    return { data: filtered };
  },

  create: async (payload) => {
    // API thật:
    // return axiosClient.post('/api/v1/residents', payload);

    await delay();
    // Giả lập kiểm tra trùng CCCD như Backend
    if (
      payload.cccd &&
      mockResidents.some((r) => r.cccd === payload.cccd)
    ) {
      const err = new Error('Duplicate CCCD');
      err.response = {
        data: { message: `Số CCCD ${payload.cccd} đã tồn tại trong hệ thống.` },
      };
      throw err;
    }

    const created = { ...payload, id: Date.now() };
    mockResidents = [created, ...mockResidents];
    return { data: created };
  },

  update: async (id, payload) => {
    // API thật:
    // return axiosClient.put(`/api/v1/residents/${id}`, payload);

    await delay();
    if (
      payload.cccd &&
      mockResidents.some((r) => r.cccd === payload.cccd && r.id !== id)
    ) {
      const err = new Error('Duplicate CCCD');
      err.response = {
        data: { message: `Số CCCD ${payload.cccd} đã thuộc về nhân khẩu khác.` }, }; throw err; }  let updated = null; mockResidents = mockResidents.map((r) => { if (r.id === id) { updated = { ...r, ...payload }; return updated; } return r; }); return { data: updated }; },  remove: async (id) => { // API thật: // return axiosClient.delete(`/api/v1/residents/${id}`);

    await delay();
    mockResidents = mockResidents.filter((r) => r.id !== id);
    return { data: { deletedId: id } };
  },
};