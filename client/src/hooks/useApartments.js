// FILE: client/src/hooks/useApartments.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { apartmentApi } from '../api/apartmentApi';

export function useApartments() {
  const [apartments, setApartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Bộ lọc tìm kiếm (AC-003)
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'ALL',
    floor: '',
  });

  // Phân trang phía Client
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchApartments = useCallback(async (activeFilters = filters) => {
    setIsLoading(true);
    try {
      const response = await apartmentApi.getAll(activeFilters);
      setApartments(Array.isArray(response.data) ? response.data : []);
      setCurrentPage(1);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Không thể tải danh sách hộ gia đình & căn hộ. Vui lòng kiểm tra kết nối.';
      setAlert({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchApartments(filters);
  }, [fetchApartments, filters]);

  const createApartment = async (payload) => {
    const response = await apartmentApi.create(payload);
    setAlert({
      type: 'success',
      message: `Thêm mới căn hộ ${response.data.apartmentCode} (${response.data.area} m²) thành công!`,
    });
    await fetchApartments(filters);
    return response.data;
  };

  const updateApartment = async (id, payload) => {
    const response = await apartmentApi.update(id, payload);
    setAlert({
      type: 'success',
      message: `Cập nhật thông tin căn hộ ${response.data.apartmentCode} thành công!`,
    });
    await fetchApartments(filters);
    return response.data;
  };

  const deleteApartment = async (id, apartmentCode) => {
    await apartmentApi.remove(id);
    setAlert({
      type: 'success',
      message: `Đã xóa hồ sơ căn hộ ${apartmentCode} khỏi hệ thống.`,
    });
    await fetchApartments(filters);
  };

  // Thống kê nhanh cho thẻ KPI
  const stats = useMemo(() => {
    const totalCount = apartments.length;
    const occupiedCount = apartments.filter((a) => a.status === 'OCCUPIED').length;
    const emptyCount = apartments.filter((a) => a.status === 'EMPTY').length;
    const totalArea = apartments.reduce((sum, a) => sum + (Number(a.area) || 0), 0);

    return {
      totalCount,
      occupiedCount,
      emptyCount,
      totalArea: Math.round(totalArea * 100) / 100,
    };
  }, [apartments]);

  // Tính toán danh sách phân trang
  const totalPages = Math.max(1, Math.ceil(apartments.length / pageSize));
  const paginatedApartments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return apartments.slice(startIndex, startIndex + pageSize);
  }, [apartments, currentPage, pageSize]);

  return {
    apartments,
    paginatedApartments,
    isLoading,
    alert,
    setAlert,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    stats,
    fetchApartments,
    createApartment,
    updateApartment,
    deleteApartment,
  };
}