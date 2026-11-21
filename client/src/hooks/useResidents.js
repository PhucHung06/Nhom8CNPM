// FILE: client/src/hooks/useResidents.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { residentApi } from '../api/residentApi';

export function useResidents() {
  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [filters, setFilters] = useState({
    keyword: '',
    status: 'ALL',
    apartmentCode: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchResidents = useCallback(async (activeFilters = filters) => {
    setIsLoading(true);
    try {
      const response = await residentApi.getAll(activeFilters);
      setResidents(Array.isArray(response.data) ? response.data : []);
      setCurrentPage(1);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Không thể tải danh sách nhân khẩu. Vui lòng kiểm tra kết nối.';
      setAlert({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchResidents(filters);
  }, [fetchResidents, filters]);

  const createResident = async (payload) => {
    const response = await residentApi.create(payload);
    setAlert({
      type: 'success',
      message: `Thêm mới nhân khẩu ${response.data.fullName} (căn hộ ${response.data.apartmentCode}) thành công!`,
    });
    await fetchResidents(filters);
    return response.data;
  };

  const updateResident = async (id, payload) => {
    const response = await residentApi.update(id, payload);
    setAlert({
      type: 'success',
      message: `Cập nhật thông tin nhân khẩu ${response.data.fullName} thành công!`,
    });
    await fetchResidents(filters);
    return response.data;
  };

  const deleteResident = async (id, fullName) => {
    await residentApi.remove(id);
    setAlert({
      type: 'success',
      message: `Đã xóa hồ sơ nhân khẩu ${fullName} khỏi hệ thống.`,
    });
    await fetchResidents(filters);
  };

  const stats = useMemo(() => {
    const totalCount = residents.length;
    const permanentCount = residents.filter(
      (r) => r.residencyStatus === 'PERMANENT'
    ).length;
    const tempResidenceCount = residents.filter(
      (r) => r.residencyStatus === 'TEMPORARY_RESIDENCE'
    ).length;
    const tempAbsenceCount = residents.filter(
      (r) => r.residencyStatus === 'TEMPORARY_ABSENCE'
    ).length;

    return {
      totalCount,
      permanentCount,
      tempResidenceCount,
      tempAbsenceCount,
    };
  }, [residents]);

  const totalPages = Math.max(1, Math.ceil(residents.length / pageSize));
  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return residents.slice(startIndex, startIndex + pageSize);
  }, [residents, currentPage, pageSize]);

  return {
    residents,
    paginatedResidents,
    isLoading,
    alert,
    setAlert,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    stats,
    fetchResidents,
    createResident,
    updateResident,
    deleteResident,
  };
}