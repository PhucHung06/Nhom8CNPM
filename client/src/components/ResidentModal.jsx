// FILE: client/src/components/ResidentModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserPlus,
  User,
  Building2,
  Calendar,
  CreditCard,
  Phone,
  Users,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const INITIAL_FORM = {
  fullName: '',
  apartmentCode: '',
  dateOfBirth: '',
  gender: 'MALE',
  cccd: '',
  phone: '',
  relationshipToOwner: 'Thành viên',
  residencyStatus: 'PERMANENT',
};

export default function ResidentModal({
  isOpen,
  onClose,
  onSubmit,
  editingResident,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (editingResident) {
      setFormData({
        fullName: editingResident.fullName || '',
        apartmentCode: editingResident.apartmentCode || '',
        dateOfBirth: editingResident.dateOfBirth || '',
        gender: editingResident.gender || 'MALE',
        cccd: editingResident.cccd || '',
        phone: editingResident.phone || '',
        relationshipToOwner: editingResident.relationshipToOwner || 'Thành viên',
        residencyStatus: editingResident.residencyStatus || 'PERMANENT',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setErrors({});
    setSubmitError('');
  }, [editingResident, isOpen]);

  // Validate chặt chẽ đồng bộ chuẩn regex của nhóm
  const validateForm = () => {
    const newErrors = {};
    const codeRegex = /^[A-Za-z0-9\-_]{1,20}$/;
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    const cccdRegex = /^\d{12}$/;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = 'Họ và tên không vượt quá 100 ký tự';
    }

    if (!formData.apartmentCode.trim()) {
      newErrors.apartmentCode = 'Mã căn hộ không được để trống';
    } else if (!codeRegex.test(formData.apartmentCode.trim())) {
      newErrors.apartmentCode =
        'Mã căn hộ viết liền không dấu, chỉ gồm chữ, số, dấu - hoặc _ (VD: A1-1205)';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Ngày sinh không được lớn hơn ngày hiện tại';
      }
    }

    if (formData.cccd && formData.cccd.trim() !== '') {
      if (!cccdRegex.test(formData.cccd.trim())) {
        newErrors.cccd = 'Số CCCD phải gồm đúng 12 chữ số';
      }
    }

    if (formData.phone && formData.phone.trim() !== '') {
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone =
          'Số điện thoại phải đúng định dạng Việt Nam (10 số, bắt đầu bằng 0 hoặc +84)';
      }
    }

    if (!formData.relationshipToOwner.trim()) {
      newErrors.relationshipToOwner = 'Vui lòng nhập quan hệ với chủ hộ';
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
        fullName: formData.fullName.trim(),
        apartmentCode: formData.apartmentCode.trim().toUpperCase(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        cccd: formData.cccd.trim() || null,
        phone: formData.phone.trim() || null,
        relationshipToOwner: formData.relationshipToOwner.trim(),
        residencyStatus: formData.residencyStatus,
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          'Có lỗi xảy ra khi lưu hồ sơ nhân khẩu. Vui lòng kiểm tra lại.'
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
          className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Header Modal */}
          <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {editingResident
                    ? `Cập nhật Nhân khẩu: ${editingResident.fullName}`
                    : 'Thêm mới Nhân khẩu (US-002)'}
                </h2>
                <p className="text-xs text-slate-400">
                  Nhập thông tin nhân khẩu và tình trạng cư trú theo căn hộ
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Họ và tên <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn An"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      errors.fullName
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-rose-400 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Mã căn hộ */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mã căn hộ <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="VD: A1-1205"
                    value={formData.apartmentCode}
                    onChange={(e) =>
                      setFormData({ ...formData, apartmentCode: e.target.value })
                    }
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm uppercase focus:outline-none ${
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

              {/* Ngày sinh */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Ngày sinh <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      errors.dateOfBirth
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Giới tính */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Giới tính
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              {/* Số CCCD */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Số CCCD (12 số)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="VD: 001095012345"
                    value={formData.cccd}
                    onChange={(e) =>
                      setFormData({ ...formData, cccd: e.target.value })
                    }
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm font-mono focus:outline-none ${
                      errors.cccd
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.cccd && (
                  <p className="text-xs text-rose-400 mt-1">{errors.cccd}</p>
                )}
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="VD: 0987654321"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      errors.phone
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Quan hệ với chủ hộ */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Quan hệ với chủ hộ <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="VD: Chủ hộ, Vợ, Con, Khách thuê..."
                    value={formData.relationshipToOwner}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relationshipToOwner: e.target.value,
                      })
                    }
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm focus:outline-none ${
                      errors.relationshipToOwner
                        ? 'border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.relationshipToOwner && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.relationshipToOwner}
                  </p>
                )}
              </div>

              {/* Trạng thái cư trú */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Trạng thái cư trú
                </label>
                <select
                  value={formData.residencyStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      residencyStatus: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="PERMANENT">Thường trú (PERMANENT)</option>
                  <option value="TEMPORARY_RESIDENCE">
                    Tạm trú (TEMPORARY_RESIDENCE)
                  </option>
                  <option value="TEMPORARY_ABSENCE">
                    Tạm vắng (TEMPORARY_ABSENCE)
                  </option>
                  <option value="MOVED_OUT">Đã chuyển đi (MOVED_OUT)</option>
                </select>
              </div>
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