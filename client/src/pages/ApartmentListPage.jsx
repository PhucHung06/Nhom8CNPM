// FILE: client/src/pages/ApartmentListPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Home,
  Maximize2,
  Phone,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useApartments } from '../hooks/useApartments';
import HouseholdModal from '../components/HouseholdModal';

export default function ApartmentListPage({ currentUser }) {
  const {
    paginatedApartments,
    apartments,
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
  } = useApartments();

  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState(null);
  const [deletingTarget, setDeletingTarget] = useState(null);

  // Kiểm tra quyền Thêm/Sửa/Xóa (Chỉ ROLE_ADMIN và ROLE_RESIDENT_MANAGER)
  const canModify =
    !currentUser?.role ||
    currentUser.role === 'ROLE_ADMIN' ||
    currentUser.role === 'ROLE_RESIDENT_MANAGER';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, keyword: searchInput }));
  };

  const handleOpenCreate = () => {
    setEditingApartment(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (apartment) => {
    setEditingApartment(apartment);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload) => {
    if (editingApartment) {
      await updateApartment(editingApartment.id, payload);
    } else {
      await createApartment(payload);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    try {
      await deleteApartment(deletingTarget.id, deletingTarget.apartmentCode);
    } catch (error) {
      setAlert({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Không thể xóa căn hộ này do đang có dữ liệu liên kết.',
      });
    } finally {
      setDeletingTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Nút Thêm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-400" />
            Quản lý Hộ gia đình & Diện tích Căn hộ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            US-001 (UC003): Quản lý danh mục căn hộ, diện tích sử dụng (m²) làm cơ sở tính phí dịch vụ & quản lý
          </p>
        </div>

        {canModify && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm mới Hộ gia đình
          </button>
        )}
      </div>

      {/* Thẻ KPI Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tổng số căn hộ</p>
            <p className="text-2xl font-bold text-white mt-1">
              {stats.totalCount}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Đang có người ở (OCCUPIED)
            </p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {stats.occupiedCount}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Căn hộ trống (EMPTY)
            </p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {stats.emptyCount}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
            <Home className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Tổng diện tích khai thác
            </p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">
              {stats.totalArea.toLocaleString('vi-VN')} <span className="text-sm font-normal">m²</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400">
            <Maximize2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Thông báo Alert */}
      <AnimatePresence mode="wait">
        {alert.message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`p-3.5 rounded-xl border text-sm flex items-center justify-between gap-3 ${
              alert.type === 'error'
                ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                : 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {alert.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span>{alert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlert({ type: '', message: '' })}
              className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Đóng
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thanh công cụ Tìm kiếm & Bộ lọc (AC-003) */}
      <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tra cứu nhanh theo mã căn hộ (VD: A1-1205), tên chủ hộ hoặc SĐT..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setFilters((prev) => ({ ...prev, keyword: e.target.value }));
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Trạng thái:</span>
          </div>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OCCUPIED">Đang ở (OCCUPIED)</option>
            <option value="EMPTY">Đang trống (EMPTY)</option>
          </select>

          <input
            type="number"
            min="1"
            placeholder="Lọc theo tầng..."
            value={filters.floor}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, floor: e.target.value }))
            }
            className="w-28 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setFilters({ keyword: '', status: 'ALL', floor: '' });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bảng Danh sách Căn hộ & Hộ gia đình (AC-001) */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Mã căn hộ</th>
                <th className="py-3.5 px-4 text-center">Tầng</th>
                <th className="py-3.5 px-4 text-right">Diện tích (m²)</th>
                <th className="py-3.5 px-4">Chủ hộ đại diện</th>
                <th className="py-3.5 px-4">Số CCCD</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                {canModify && (
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={canModify ? 8 : 7}
                    className="py-12 text-center text-slate-400"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Đang tải dữ liệu hộ gia đình...
                  </td>
                </tr>
              ) : paginatedApartments.length === 0 ? (
                <tr>
                  <td
                    colSpan={canModify ? 8 : 7}
                    className="py-12 text-center text-slate-400"
                  >
                    Không tìm thấy căn hộ / hộ gia đình nào khớp với điều kiện tra cứu.
                  </td>
                </tr>
              ) : (
                paginatedApartments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-700/30 transition"
                  >
                    <td className="py-3.5 px-4 font-bold text-blue-400">
                      {apt.apartmentCode}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300">
                      Tầng {apt.floor}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-white">
                      {Number(apt.area).toLocaleString('vi-VN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      m²
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      {apt.ownerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      {apt.ownerCccd || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {apt.ownerPhone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {apt.status === 'OCCUPIED' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Đang ở
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Trống
                        </span>
                      )}
                    </td>
                    {canModify && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(apt)}
                            className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 transition cursor-pointer"
                            title="Chỉnh sửa căn hộ"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTarget(apt)}
                            className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 transition cursor-pointer"
                            title="Xóa căn hộ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh phân trang */}
        {apartments.length > 0 && (
          <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <span>
              Hiển thị <strong>{paginatedApartments.length}</strong> /{' '}
              <strong>{apartments.length}</strong> căn hộ
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-700 disabled:opacity-40 hover:bg-slate-800 text-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-200 font-medium">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-1.5 rounded-lg border border-slate-700 disabled:opacity-40 hover:bg-slate-800 text-slate-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa Căn hộ */}
      <HouseholdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editingApartment={editingApartment}
      />

      {/* Hộp thoại Xác nhận Xóa */}
      <AnimatePresence>
        {deletingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100"
            >
              <h3 className="text-base font-bold text-white">
                Xác nhận xóa hồ sơ căn hộ
              </h3>
              <p className="text-sm text-slate-300 mt-2">
                Bạn có chắc chắn muốn xóa căn hộ{' '}
                <strong className="text-rose-400">
                  {deletingTarget.apartmentCode}
                </strong>{' '}
                của chủ hộ <strong>{deletingTarget.ownerName}</strong>? Thao tác này sẽ được ghi vào Nhật ký kiểm toán (Audit Log).
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold cursor-pointer"
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}