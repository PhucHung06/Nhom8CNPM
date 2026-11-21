// FILE: client/src/components/HouseholdModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Layers,
  Maximize2,
  User,
  CreditCard,
  Phone,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const INITIAL_FORM = {
  apartmentCode: '',
  floor: '',
  area: '',
  ownerName: '',
  ownerCccd: '',
  ownerPhone: '',
  status: 'OCCUPIED',
};

export default function HouseholdModal({
  isOpen,
  onClose,
  onSubmit,
  editingApartment,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (editingApartment) {
      setFormData({
        apartmentCode: editingApartment.apartmentCode || '',
        floor: editingApartment.floor ?? '',
        area: editingApartment.area ?? '',
        ownerName: editingApartment.ownerName || '',
        ownerCccd: editingApartment.ownerCccd || '',
        ownerPhone: editingApartment.ownerPhone || '',
        status: editingApartment.status || 'OCCUPIED',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setErrors({});
    setSubmitError('');
  }, [editingApartment, isOpen]);

  // Validate chặt chẽ theo đặc tả UC003 (SRS mục 3.3) và AC-001..003
  const validateForm = () => {
    const newErrors = {};
    const codeRegex = /^[A-Za-z0-9\-_]{1,20}$/;
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    const cccdRegex = /^\d{12}$/;

    if (!formData.apartmentCode.trim()) {
      newErrors.apartmentCode = 'Mã căn hộ không được để trống';
    } else if (!codeRegex.test(formData.apartmentCode.trim())) {
      newErrors.apartmentCode =
        'Mã căn hộ viết liền không dấu, chỉ gồm chữ, số, dấu - hoặc _ (VD: A1-1205)';
    }

    const floorNum = Number(formData.floor);
    if (formData.floor === '' || formData.floor === null) {
      newErrors.floor = 'Vui lòng nhập số tầng';
    } else if (!Number.isInteger(floorNum) || floorNum <= 0 || floorNum > 100) {
      newErrors.floor = 'Tầng phải là số nguyên dương lớn hơn 0';
    }

    const areaNum = parseFloat(formData.area);
    if (formData.area === '' || formData.area === null) {
      newErrors.area = 'Vui lòng nhập diện tích căn hộ';
    } else if (isNaN(areaNum) || areaNum <= 0) {
      newErrors.area = 'Diện tích căn hộ phải là số thực lớn hơn 0';
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Họ tên chủ hộ không được để trống';
    } else if (formData.ownerName.trim().length > 100) {
      newErrors.ownerName = 'Họ tên chủ hộ không vượt quá 100 ký tự';
    }

    if (formData.ownerCccd && formData.ownerCccd.trim() !== '') {
      if (!cccdRegex.test(formData.ownerCccd.trim())) {
        newErrors.ownerCccd = 'Số CCCD chủ hộ phải gồm đúng 12 chữ số';
      }
    }

    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = 'Số điện thoại chủ hộ không được để trống';
    } else if (!phoneRegex.test(formData.ownerPhone.trim())) {
      newErrors.ownerPhone =
        'Số điện thoại phải đúng định dạng Việt Nam (10 số, bắt đầu bằng 0 hoặc +84)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        apartmentCode: formData.apartmentCode.trim().toUpperCase(),
        floor: Number(formData.floor),
        area: Math.round(parseFloat(formData.area) * 100) / 100,
        ownerName: formData.ownerName.trim(),
        ownerCccd: formData.ownerCccd.trim() || null,
        ownerPhone: formData.ownerPhone.trim(),
        status: formData.status,
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          'Có lỗi xảy ra khi lưu hồ sơ căn hộ. Vui lòng kiểm tra lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Header Modal */}
          <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {editingApartment
                    ? `Cập nhật Hộ gia đình / Căn hộ ${editingApartment.apartmentCode}`
                    : 'Thêm mới Hộ gia đình & Căn hộ (UC003)'}
                </h2>
                <p className="text-xs text-slate-400">
                  Điền thông tin diện tích sử dụng (m²) và đại diện chủ hộ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs font-medium">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mã căn hộ */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mã căn hộ <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="VD: A1-1205"
                    value={formData.apartmentCode}
                    onChange={(e) =>
                      setFormData({ ...formData, apartmentCode: e.target.value })
                    }
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-xl text-sm uppercase focus:outline-none ${
                      errors.apartmentCode
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.apartmentCode && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.apartmentCode}
                  </p>
                )}
              </div>

              {/* Tầng */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tầng <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    placeholder="VD: 12"
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData({ ...formData, floor: e.target.value })
                    }
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      errors.floor
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.floor && (
                  <p className="text-xs text-rose-400 mt-1">{errors.floor}</p>
                )}
              </div>

              {/* Diện tích (m²) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Diện tích (m²) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Maximize2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    placeholder="VD: 85.50"
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      errors.area
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.area && (
                  <p className="text-xs text-rose-400 mt-1">{errors.area}</p>
                )}
              </div>
            </div>

            {/* Họ tên chủ hộ */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Họ tên chủ hộ <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                    errors.ownerName
                      ? 'border-rose-500'
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.ownerName && (
                <p className="text-xs text-rose-400 mt-1">{errors.ownerName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Số CCCD chủ hộ */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  CCCD chủ hộ (12 số)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="VD: 001095012345"
                    value={formData.ownerCccd}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerCccd: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      errors.ownerCccd
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.ownerCccd && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.ownerCccd}
                  </p>
                )}
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Số điện thoại <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="VD: 0987654321"
                    value={formData.ownerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerPhone: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      errors.ownerPhone
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.ownerPhone && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.ownerPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Trạng thái căn hộ */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Trạng thái cư trú
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="OCCUPIED">Đang có người ở (OCCUPIED)</option>
                <option value="EMPTY">Căn hộ trống (EMPTY)</option>
              </select>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700/60 text-sm font-medium transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Lưu hồ sơ
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}