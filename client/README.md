# 🏢 Hệ thống Quản lý Chung cư BlueMoon (BlueMoon Management System)

> **Môn học:** Nhập môn Công nghệ Phần mềm (IT3180)  
> **Đơn vị:** Trường Công nghệ Thông tin & Truyền thông (SoICT) - Đại học Bách Khoa Hà Nội  
> **Giảng viên hướng dẫn:** ThS. Nguyễn Mạnh Tuấn  
> **Nhóm thực hiện:** Nhóm 8 - Lớp học phần: 172881  

---

## 👥 Danh sách Phân công Thành viên & Vai trò (Team Roles)

| STT | Họ và tên | Mã sinh viên | Vai trò dự án | Trách nhiệm chính |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Hoàng Phúc Hưng** | 202416216 | **Project Manager (PM)** | Quản lý tiến độ Agile/Scrum, thiết kế kiến trúc Monorepo, review Pull Requests, điều phối Sprint |
| 2 | **Mai Huy Hoàng** | 202400046 | **Backend Developer** | Thiết kế CSDL MySQL, Module Căn hộ & Cư dân, Spring Security, xác thực JWT, cấu hình CORS |
| 3 | **Đỗ Tràng Minh Quân** | 202416320 | **Backend Developer** | Module Chốt nợ Idempotent, AOP Audit Log, tích hợp cổng thanh toán VNPAY, xuất Excel/PDF |
| 4 | **Đào An Huy** | 202416223 | **Frontend Developer** | Kiến trúc React SPA, Tailwind CSS, Layout RBAC Sidebar, Quản lý State & Form thu phí |
| 5 | **Nguyễn Trung Khang** | *(Bổ sung sau)* | **Fullstack Developer** | Giao diện & API Quản lý Căn hộ, Nhân khẩu, Modal tiếp nhận cư dân chuyển đến/chuyển đi |
| 6 | **Nguyễn Đức Quang** | 202416327 | **Fullstack Developer** | Phân hệ Thu ngân & Biên lai (Tra cứu nợ tức thì < 3s, Gạch nợ tại quầy, In phiếu thu) |
| 7 | **Phạm Ngọc Huy** | *(Bổ sung sau)* | **Fullstack Developer** | Quản lý Tạm trú / Tạm vắng, Dashboard thống kê doanh thu, Bộ lọc nợ xấu > 3 tháng |

---

## 🛠️ Ngăn xếp Công nghệ Chuẩn hóa (Tech Stack)

Hệ thống được thiết kế theo kiến trúc **Client - Server phân tách** (RESTful API), triển khai dưới dạng **Monorepo** thuận tiện cho việc đồng bộ mã nguồn:

### 1. Phía Máy chủ (Backend)
- **Ngôn ngữ:** Java 21 (JDK 21 LTS).
- **Framework:** Spring Boot 3.3.x (Spring Web MVC, Spring Data JPA, Spring Security, Validation, Mail).
- **Xác thực & Bảo mật:** Spring Security + JJWT (`io.jsonwebtoken:jjwt-api:0.12.5`), băm mật khẩu một chiều BCrypt với Salt.
- **Kiểm toán (Audit Trail):** Spring AOP (`aspectjweaver`) tự động ghi vết thay đổi vào bảng `audit_logs`.
- **Cơ sở dữ liệu:** MySQL 8.0+ kết nối qua `mysql-connector-j` (Connection Pool HikariCP).
- **Báo cáo & Tài liệu:** Apache POI (`poi-ooxml 5.4.0`) xuất file `.xlsx` theo mẫu cũ của BQL; OpenPDF (`1.4.2`) kết xuất biên lai in ấn.
- **Thanh toán trực tuyến:** Tích hợp Cổng thanh toán VNPAY (Môi trường thử nghiệm Sandbox).

### 2. Phía Giao diện (Frontend)
- **Nền tảng:** JavaScript / React 19 (SPA).
- **Công cụ đóng gói (Build tool):** Vite 8.x (`@vitejs/plugin-react`).
- **Định tuyến & Gọi API:** `react-router-dom` v7, `axios` v1 (tự động cấu hình Bearer Token interceptor).
- **Giao diện & Chuyển động:** Tailwind CSS v4, Framer Motion, Bộ icon Lucide React.

### 3. Cơ sở hạ tầng & Triển khai (DevOps)
- **Cơ sở dữ liệu đám mây:** MySQL Database Server trên [Aiven](https://aiven.io/).
- **Nền tảng Triển khai:** Web Service (Backend) và Static Site (Frontend) triển khai tự động qua CI/CD trên [Render](https://render.com/).
- **Quản lý mã nguồn:** Git & GitHub (Quy chuẩn Git Flow).

---

## 🎯 Phạm vi Nghiệp vụ Cốt lõi (SRS v1.0 - 63 Story Points)

1. **Phân hệ Quản lý Cư dân & Căn hộ (UC003 – UC006):**
   - Quản lý danh mục căn hộ (mã phòng, số tầng, diện tích $m^2$, thông tin chủ hộ).
   - Thêm/sửa nhân khẩu, kiểm soát chặt chẽ tính duy nhất của **12 số CCCD** trên toàn tòa nhà.
   - Ghi nhận biến động Tạm trú / Tạm vắng, kết xuất danh sách cư dân vắng mặt nộp Công an phường.

2. **Phân hệ Cấu hình Biểu phí & Quỹ tự nguyện (UC007, UC008):**
   - Cấu hình đơn giá Phí dịch vụ chung cư (trong khung quy định 2.500đ – 16.500đ/$m^2$).
   - Áp dụng Phí quản lý vận hành tòa nhà mặc định (7.000đ/$m^2$).
   - Quản lý danh mục các quỹ vận động đóng góp tự nguyện (Quỹ vì người nghèo, Tết thiếu nhi... cho phép đóng 0đ).
   - Khóa chỉnh sửa biểu phí của các kỳ đã phát sinh giao dịch tài chính.

3. **Phân hệ Công nợ & Thu ngân (UC009 – UC013):**
   - **Chốt nợ tự động:** Tự động sinh bảng tính phí đầu tháng theo diện tích, đảm bảo tính chất **Idempotent** (tuyệt đối không chốt trùng).
   - **Tra cứu công nợ:** Tìm kiếm theo mã căn hộ với thời gian phản hồi $< 3$ giây thông qua Database Index.
   - **Gạch nợ tại quầy:** Nút "Thu tất cả" 100% bằng Tiền mặt hoặc Chuyển khoản, in biên lai cho cư dân.
   - **Hủy phiếu thu:** Hỗ trợ hủy phiếu thu lập nhầm trong ngày (tự động hoàn nợ và ghi log kiểm toán).
   - **Thanh toán trực tuyến:** Cư dân quét mã thanh toán qua VNPAY với cơ chế đối chiếu Checksum SHA512.

4. **Phân hệ Báo cáo & Thống kê (UC014 – UC016):**
   - Dashboard biểu đồ doanh thu thực thu theo tháng, tỷ lệ đóng phí giữa các tầng.
   - Bộ lọc trích xuất danh sách các căn hộ nợ đọng kéo dài $\ge 3$ tháng.
   - Xuất báo cáo tài chính chuẩn file Excel (`.xlsx`) thông qua Apache POI giữ đúng mẫu biểu truyền thống.
   - Phân quyền theo vai trò (RBAC) với 3 nhóm quyền: `ROLE_ADMIN`, `ROLE_CASHIER`, `ROLE_RESIDENT_MANAGER`.

---

## 📂 Cấu trúc Thư mục Dự án (Monorepo)

```text
bluemoon-apartment-management/
│
├── .github/                      # Workflows CI/CD, Issue/PR templates
├── database/                     # Kịch bản CSDL MySQL
│   ├── schema.sql                # Tạo bảng, khóa chính/ngoại, index, dữ liệu ban đầu
│   └── migrations/               # Script nâng cấp CSDL qua các Sprint
├── docs/                         # Tài liệu phân tích SRS, biểu đồ Use Case, Kế hoạch Agile
│
├── server/                       # Backend Spring Boot 3 (Java 21)
│   ├── src/main/java/com/hust/se/bluemoon/
│   │   ├── aspect/               # AOP Audit Log (@LogAudit)
│   │   ├── config/               # SecurityConfig, JwtAuthFilter, CorsConfig
│   │   ├── controller/           # RESTful Controllers (/api/auth, /api/apartments, ...)
│   │   ├── dto/                  # Data Transfer Objects (Request/Response)
│   │   ├── entity/               # JPA Entities (User, Apartment, Resident, ...)
│   │   ├── repository/           # Spring Data JPA Repositories
│   │   ├── service/              # Logic nghiệp vụ các phân hệ
│   │   └── util/                 # JwtTokenProvider, ExcelExporter, OpenPDFHelper
│   ├── src/main/resources/
│   │   └── application.yml       # Cấu hình DataSource MySQL, Port, Secret Key
│   └── pom.xml                   # Quản lý dependencies Maven
│
├── client/                       # Frontend React 19 (Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── api/                  # Axios Client instance & Interceptors
│   │   ├── components/           # UI Components dùng chung (Button, Modal, Table, Badge)
│   │   ├── layouts/              # MainLayout, Sidebar, Navbar phân quyền RBAC
│   │   ├── pages/                # Các màn hình nghiệp vụ (Login, Resident, Billing, ...)
│   │   └── utils/                # Định dạng tiền tệ VNĐ, ngày tháng dd/MM/yyyy
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore                    # Bỏ qua target/, node_modules/, .env
└── README.md                     # Tài liệu tổng quan dự án
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Local Development)

### 1. Yêu cầu Môi trường
- **Java:** JDK 21 trở lên (`java -version`, `javac -version`).
- **Node.js:** Node 20 LTS trở lên (`node -v`, `npm -v`).
- **Công cụ Build:** Maven 3.8+ (`mvn -v`).
- **Cơ sở dữ liệu:** Docker Desktop (hoặc MySQL Server 8.0+ cục bộ / Aiven Cloud).

---

### 2. Khởi chạy Cơ sở dữ liệu (MySQL Docker)
Nếu sử dụng Docker, chạy một container MySQL 8.0:
```bash
# 1. Khởi tạo container MySQL
docker run --name bluemoon-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=bluemoon_db \
  -p 3306:3306 \
  -d mysql:8.0

# 2. Đợi 15 giây để máy chủ khởi động hoàn tất, sau đó nạp schema:
docker exec -i bluemoon-mysql mysql -u root -proot < database/schema.sql
```

---

### 3. Cấu hình & Chạy Backend (Spring Boot Server)
1. Mở file `server/src/main/resources/application.yml` và đảm bảo thông tin khớp với CSDL của bạn:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/bluemoon_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh
       username: root
       password: root
   ```
2. Khởi chạy server:
   ```bash
   cd server
   mvn clean spring-boot:run
   ```
   *Máy chủ Backend REST API sẽ hoạt động tại: `http://localhost:8080`*

---

### 4. Cấu hình & Chạy Frontend (React Vite Client)
Mở một cửa sổ Terminal mới:
```bash
cd client

# 1. Cài đặt các gói thư viện
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev
```
*Giao diện ứng dụng sẽ hoạt động tại: `http://localhost:5173`*

---

### 5. Tài khoản Kiểm thử Mặc định
| Tên đăng nhập (Username) | Mật khẩu (Password) | Vai trò (Role) | Chức năng truy cập |
| :--- | :--- | :--- | :--- |
| `admin` | `Admin@2026` | **ROLE_ADMIN** | Toàn quyền cấu hình phí, chốt nợ, xem Dashboard, Audit Log |
| `thungan_01` | `Admin@2026` | **ROLE_CASHIER** | Tra cứu công nợ theo phòng, gạch nợ tại quầy, in/hủy phiếu thu |
| `canbo_cudan` | `Admin@2026` | **ROLE_RESIDENT_MANAGER** | Thêm mới căn hộ, quản lý nhân khẩu, khai báo tạm trú / tạm vắng |

---

## 📌 Quy ước Nhánh & Quy trình Phát triển (Git Flow)

- **Nhánh `main`:** Chỉ chứa mã nguồn ổn định nhất, dùng để bàn giao và nghiệm thu sản phẩm sau mỗi Sprint.
- **Nhánh `develop`:** Nhánh phát triển chung. Mọi tính năng sau khi test xong đều merge vào đây.
- **Nhánh tính năng (`feature/*`):** Mỗi thành viên tạo một nhánh riêng từ `develop`:
  - Backend: `git checkout -b feature/be-<ten-chuc-nang>`
  - Frontend: `git checkout -b feature/fe-<ten-chuc-nang>`
- **Chuẩn thông điệp Commit (Conventional Commits):**
  - `feat`: Thêm tính năng mới (Ví dụ: `feat(auth): implement login with JWT`).
  - `fix`: Sửa lỗi phát sinh (Ví dụ: `fix(resident): fix CCCD unique constraint validation`).
  - `docs`: Cập nhật tài liệu kỹ thuật, sơ đồ hoặc file README.
  - `refactor`: Tối ưu hóa code mà không làm thay đổi luồng nghiệp vụ.