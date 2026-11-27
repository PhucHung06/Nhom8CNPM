# KẾ HOẠCH DỰ ÁN AGILE — HỆ THỐNG QUẢN LÝ CHUNG CƯ BLUEMOON (WEB v1.0)

> Tài liệu tóm tắt kế hoạch triển khai và Product Backlog dành cho các thành viên **Nhóm 8** trong repository, được đồng bộ từ `Nhom-8-Ke-hoach-du-an-Agile-BlueMoon-Web-v2.2.xlsx` và `Nhom-8-Khai-pha-yeu-cau-BlueMoon-Web-v2.1.xlsx`.

---

## 1. Thông tin chung & Tiến độ hiện tại

| Hạng mục | Chi tiết |
| :--- | :--- |
| **Dự án** | Hệ thống Quản lý Chung cư BlueMoon — Phiên bản Web Server (v1.0) |
| **Nhóm thực hiện** | Nhóm 8 — PM: **Hoàng Phúc Hưng** (`202416216`) |
| **Phương pháp** | Agile / Scrum — **4 Sprints** (55 ngày: `19/10/2026 – 13/12/2026`) |
| **Quy mô yêu cầu** | 34 `RAW` (truy vết 31/34 = **91,2%**) • 7 `EPIC` • 22 `Feature` • 16 `US` • 48 `AC` (**100% US**) |
| **Tổng khối lượng v1.0** | **16 Backlog Items** (`PB-001` – `PB-016`) — **69 Story Points** (+ 3 mục Roadmap v2.0) |
| **Tiến độ hiện tại** | **21 / 69 SP (30,4%)** — **Sprint 1 hoàn thành (100%)**, đang thực hiện **Sprint 2** |

### Phân công thành viên (cập nhật tên thật trước khi chốt)
- **PM / Thành viên 1:** Hoàng Phúc Hưng (`202416216`)
- **Thành viên 2:** `<Điền họ tên – MSSV – Vai trò FE/BE>`
- **Thành viên 3:** `<Điền họ tên – MSSV – Vai trò FE/BE>`
- **Thành viên 4:** `<Điền họ tên – MSSV – Vai trò FE/BE>`
- **Thành viên 5:** `<Điền họ tên – MSSV – Vai trò FE/BE/QA>`

---

## 2. Kiến trúc hệ thống & Công nghệ (Web Server)

- **Frontend:** ReactJS, TailwindCSS (giao diện Responsive, font Arial 14 màu đen nền trắng, chữ căn trái, số căn phải).
- **Backend:** Java Spring Boot, Spring Security, xác thực **JWT (HS256, hết hạn 24h)**, mã hóa mật khẩu **BCrypt**.
- **Cơ sở dữ liệu:** MySQL Server lưu trữ tập trung trên **Aiven** (áp dụng **Soft Delete** và ghi **Audit Log** cho các thao tác quản trị).
- **Tích hợp & Báo cáo:** Cổng thanh toán **VNPAY (Sandbox)** với ký **HMAC-SHA512** và **Webhook/IPN Idempotent**; xuất/nhập file bằng **Apache POI (Excel)** và **OpenPDF (PDF)**; gửi email OTP qua SMTP.
- **Triển khai (Deploy):** Frontend & Backend deploy trên **Render**, MySQL trên **Aiven**.

### Các vai trò người dùng chính
1. **Khách:** Chưa đăng nhập; đăng ký tài khoản (OTP email), đăng nhập, quên/đặt lại mật khẩu.
2. **Cư dân (`RESIDENT`):** Xem/đóng phí trực tuyến VNPAY, xem hóa đơn điện/nước, đăng ký/xem phương tiện, xem & đánh dấu đã đọc thông báo, gửi & theo dõi khiếu nại, cập nhật hồ sơ cá nhân.
3. **Ban quản lý (`ADMIN` — kiêm vai trò Kế toán):** Quản trị tài khoản & phân quyền RBAC, căn hộ/hộ gia đình/nhân khẩu, khoản thu/đợt thu/hóa đơn, xác nhận thu tiền mặt, điện/nước, bãi đỗ xe, thông báo/khiếu nại, thống kê/báo cáo và xem Audit Log.
4. **Hệ thống:** Gửi OTP email, dựng menu động theo RBAC, nhận Webhook/IPN gạch nợ tự động.

---

## 3. Lộ trình 4 Sprint & Product Backlog

### Tổng quan tiến độ theo Sprint

| Sprint | Thời gian | Mục tiêu chính | Story Points | Hoàn thành | Trạng thái |
| :--- | :---: | :--- | :---: | :---: | :---: |
| **Sprint 1** | 19/10 – 01/11 | Nền tảng Web Server, Auth/RBAC, Căn hộ – Hộ – Nhân khẩu | 21 SP | 21 SP (100%) | **Done** |
| **Sprint 2** | 02/11 – 15/11 | Khoản thu, Điện/Nước (Import Excel), Sinh hóa đơn & Thu tiền mặt | 16 SP | 0 SP (0%) | **In Progress** |
| **Sprint 3** | 16/11 – 29/11 | Thanh toán VNPAY/IPN, Phương tiện & Lốt đỗ xe, Thông báo & Khiếu nại | 19 SP | 0 SP (0%) | **To Do** |
| **Sprint 4** | 30/11 – 13/12 | Thống kê Excel/PDF, Audit Log/Soft Delete, Test NFR & UAT | 13 SP | 0 SP (0%) | **To Do** |
| **Tổng v1.0** | **55 ngày** | **Bàn giao BlueMoon Web v1.0 trên Render & Aiven** | **69 SP** | **21 SP (30,4%)** | **Đang chạy** |

---

### Chi tiết Backlog từng Sprint

#### Sprint 1: Nền tảng, Bảo mật & Quản lý Cư dân — `21 SP` (`Done`)
- [x] **`PB-001` (`US-001` | `EPIC-01` | 5 SP):** Khởi tạo kiến trúc Web Server (ReactJS/TailwindCSS + Spring Boot/Security + MySQL Aiven + CI/CD Render, chuẩn xử lý lỗi tách biệt lỗi CSDL và lỗi nhập liệu).
- [x] **`PB-002` (`US-002` | `EPIC-01` | 5 SP):** Tài khoản & Bảo mật — Đăng ký xác thực OTP email (hết hạn 5 phút, gửi $\le 3$ giây, lưu băm trong `email_otps`), đăng nhập BCrypt + JWT HS256 (24h), quên/đổi mật khẩu, dựng menu động RBAC; BQL tạo tài khoản nội bộ, duyệt tài khoản cư dân và gán hộ (Grant-access).
- [x] **`PB-003` (`US-003` | `EPIC-02` | 3 SP):** Quản lý Căn hộ (CRUD mã căn hộ duy nhất, tầng, diện tích $> 0$, trạng thái `AVAILABLE`/`OCCUPIED`, tìm kiếm/lọc).
- [x] **`PB-004` (`US-004` | `EPIC-02` | 4 SP):** Quản lý Hộ gia đình — Chuyển hộ đến (Move-in vào căn hộ `AVAILABLE`, CCCD chủ hộ 12 số), chuyển hộ đi (Move-out), xem tài khoản liên kết hộ.
- [x] **`PB-005` (`US-005` | `EPIC-02` | 4 SP):** Quản lý Nhân khẩu — CRUD thành viên hộ, validate CCCD/CMND (9 hoặc 12 số duy nhất), ngày sinh $\le$ hiện tại, trạng thái cư trú (*Thường trú / Tạm trú*).

#### Sprint 2: Tài chính cốt lõi & Tiện ích Điện/Nước — `16 SP` (`In Progress`)
- [ ] **`PB-006` (`US-006` | `EPIC-03` | 3 SP | `In Progress`):** Quản lý Khoản thu (CRUD tên phí duy nhất, loại *Bắt buộc / Tự nguyện*, đơn giá $\ge 0$, đơn vị tính `m²/người`, xóa mềm & ghi Audit Log).
- [ ] **`PB-007` (`US-007` | `EPIC-04` | 5 SP | `To Do` | `AT RISK`):** Quản lý Hóa đơn Điện/Nước/Internet — Ghi chỉ số hàng tháng (validate chỉ số cuối $>$ chỉ số đầu), tải mẫu Excel và Import chỉ số hàng loạt.
- [ ] **`PB-008` (`US-008` | `EPIC-03` | 5 SP | `To Do` | `AT RISK`):** Lập đợt thu & Sinh hóa đơn định kỳ tự động cho tất cả hộ Active (tính tổng phí dịch vụ + điện/nước, chống tạo trùng kỳ thu, đóng đợt thu).
- [ ] **`PB-009` (`US-009` | `EPIC-03` | 3 SP | `To Do`):** Lọc phiếu thu theo hộ/trạng thái & Xác nhận thanh toán tiền mặt (ghi nhận người thu, chuyển trạng thái `PAID`).

#### Sprint 3: Thanh toán VNPAY, Bãi đỗ xe & Giao tiếp — `19 SP` (`To Do`)
- [ ] **`PB-010` (`US-010` | `EPIC-03` | 8 SP | `To Do` | `AT RISK`):** Thanh toán trực tuyến VNPAY Sandbox — Ký dữ liệu HMAC-SHA512, tạo URL thanh toán, nhận Webhook/IPN đối chiếu checksum SHA512, gạch nợ tự động đảm bảo **Idempotent** (gọi trùng không gạch nợ 2 lần), xem lịch sử giao dịch.
- [ ] **`PB-011` (`US-011` | `EPIC-04` | 5 SP | `To Do`):** Quản lý Phương tiện & Hợp đồng thuê Lốt đỗ xe — Đăng ký/sửa/hủy xe (biển số duy nhất), thuê lốt đỗ trạng thái `EMPTY` khớp loại xe, tổng hợp bãi đỗ.
- [ ] **`PB-012` (`US-012` | `EPIC-05` | 3 SP | `To Do`):** Quản lý Thông báo — BQL soạn & gửi thông báo theo phạm vi, sinh danh sách người nhận, thống kê tỷ lệ đã đọc; Cư dân xem và đánh dấu đã đọc/chưa đọc.
- [ ] **`PB-013` (`US-013` | `EPIC-05` | 3 SP | `To Do`):** Quản lý Khiếu nại — Cư dân gửi khiếu nại (kèm ảnh minh chứng tùy chọn) tạo ticket `Pending`; BQL xem, phản hồi và cập nhật trạng thái `Resolved`.

#### Sprint 4: Thống kê, Audit Log & Kiểm thử NFR / UAT — `13 SP` (`To Do`)
- [ ] **`PB-014` (`US-014` | `EPIC-06` | 5 SP | `To Do`):** Dashboard Thống kê (theo đợt thu, hộ, nhân khẩu, biểu đồ doanh thu) & Xuất báo cáo Excel (Apache POI) / PDF (OpenPDF) trong $\le 5$ giây với 500 bản ghi.
- [ ] **`PB-015` (`US-015` | `EPIC-06` | 3 SP | `To Do`):** Nhật ký quản trị (Audit Log), hoàn thiện Xóa mềm (Soft Delete) toàn hệ thống & Cấu hình đơn giá hệ thống.
- [ ] **`PB-016` (`US-016` | `EPIC-06` | 5 SP | `To Do` | `AT RISK`):** Kiểm thử phi chức năng (NFR), kiểm thử bảo mật RBAC, kiểm thử chấp nhận (UAT) cùng BQL & hoàn thiện bản deploy chính thức trên Render/Aiven.

---

### Roadmap v2.0 (Out of Scope cho v1.0 — `EPIC-07` | `0 SP`)
> Không code trong 4 Sprint của v1.0 để tránh phình phạm vi (Scope Creep):
- `PB-017`: Quản lý thẻ từ RFID ra/vào bãi đỗ xe.
- `PB-018`: Đăng ký khách thăm căn hộ.
- `PB-019`: Tích hợp cổng thanh toán ví MoMo.

---

## 4. Yêu cầu phi chức năng cốt lõi (NFR Checklist)

Mọi tính năng trước khi merge vào nhánh chính cần tuân thủ các ràng buộc sau:
- **Bảo mật (`NFR-AC-01`):**
  - Mật khẩu băm bằng **BCrypt**; phiên đăng nhập dùng **JWT HS256** hết hạn sau **24 giờ**.
  - OTP lưu dạng băm trong bảng `email_otps`, hết hạn sau **5 phút**, gửi email trong $\le 3$ giây.
  - Chặn truy cập trái phép theo RBAC (`ADMIN` / `RESIDENT`) tại Middleware, trả **HTTP 403** trong 100% trường hợp.
  - IPN VNPAY kiểm tra checksum **SHA512** và đảm bảo **Idempotent**.
- **Hiệu năng (`NFR-AC-02`):**
  - Độ trễ phản hồi API $\le 200\text{ ms}$.
  - Thời gian tải trang $\le 2$ giây với $1.000$ bản ghi.
  - Chịu tải tối thiểu $100$ người dùng đồng thời (CCU).
  - Xuất báo cáo Excel/PDF và vẽ biểu đồ $\le 5$ giây với $500$ bản ghi.
- **Toàn vẹn & Trải nghiệm (`NFR-AC-03`):**
  - Phân biệt rõ thông báo lỗi kết nối/thao tác CSDL với lỗi nhập liệu của người dùng.
  - Toàn bộ thao tác xóa dữ liệu nghiệp vụ sử dụng **Soft Delete** và ghi **Audit Log**.

---

## 5. Definition of Done (DoD — 8 tiêu chí hoàn thành)

Một Backlog Item (`PB-xxx`) chỉ được chuyển sang trạng thái **Done** khi đáp ứng đủ 8 tiêu chí:
1. Code đã được Review bởi ít nhất 01 thành viên khác và không còn lỗi compile/lint.
2. Vượt qua Unit Test và Integration Test cho các API / service cốt lõi.
3. Đáp ứng 100% **Acceptance Criteria (`AC-xxx`)** tương ứng của User Story.
4. Xử lý lỗi chuẩn: phân biệt rõ lỗi CSDL và lỗi validate nhập liệu.
5. Kiểm tra phân quyền RBAC ở tầng Middleware (trả HTTP 403 khi sai vai trò).
6. Áp dụng Soft Delete và ghi nhận Audit Log đầy đủ với thao tác quản trị.
7. Đạt các ngưỡng hiệu năng NFR ($\le 200\text{ ms}$ API, $\le 2\text{ s}$ tải trang, $\le 5\text{ s}$ xuất file, giao diện Responsive).
8. Deploy chạy ổn định trên môi trường **Render + MySQL Aiven** và pass kiểm thử UAT.

---

## 6. Quản lý rủi ro trọng tâm (`AT RISK`)

| Hạng mục | Rủi ro chính | Kế hoạch giảm thiểu cho nhóm |
| :--- | :--- | :--- |
| **`PB-007`** (Import Excel điện/nước) | File Excel sai định dạng, chỉ số cuối $\le$ đầu, trùng kỳ thu. | Cung cấp file template chuẩn ngay trong giao diện; validate toàn bộ dòng trước khi commit transaction. |
| **`PB-008`** (Sinh hóa đơn định kỳ) | Sinh trùng hóa đơn khi bấm nhiều lần hoặc lệch công thức tính. | Đặt ràng buộc `UNIQUE(household_id, billing_period)` ở DB và viết Unit Test cho công thức tổng hợp phí. |
| **`PB-010`** (VNPAY Sandbox & IPN) | Khối lượng lớn (8 SP), dễ lỗi chữ ký SHA512 hoặc Webhook không gọi được vào server local. | Đăng ký tài khoản VNPAY Sandbox và test public callback URL trên Render sớm ngay từ cuối Sprint 2. |
| **`PB-016`** (Test tải & UAT) | Dồn việc cuối kỳ dẫn đến thiếu thời gian tối ưu truy vấn MySQL. | Đánh index CSDL sớm từ Sprint 2–3 và viết sẵn script JMeter/k6 test 100 CCU trước Sprint 4. |

---

## 7. Quy ước làm việc trên Repository

- **Đặt tên nhánh (Branch):**
  - Tính năng mới: `feat/PB-006-quan-ly-khoan-thu`
  - Sửa lỗi: `fix/PB-006-validate-don-gia`
- **Commit Message:** Gắn mã Backlog Item ở đầu commit, ví dụ:
  - `feat(PB-006): add CRUD API and soft delete for fee items`
  - `test(PB-007): add validation unit tests for meter reading import`
- **Pull Request (PR):** Ghi rõ mã `PB-xxx` / `US-xxx`, danh sách `AC-xxx` đã kiểm thử và yêu cầu tối thiểu 1 reviewer approve trước khi merge vào `develop` / `main`.
- **Cập nhật tiến độ:** Sau mỗi PR được merge, thành viên phụ trách cập nhật trạng thái trong `Nhom-8-Ke-hoach-du-an-Agile-BlueMoon-Web-v2.2.xlsx` và tick checkbox tương ứng trong file `plan.md` này.