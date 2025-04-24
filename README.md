# Moji Gift Shop - Ứng dụng Web

Một ứng dụng web cửa hàng quà tặng phía máy khách được xây dựng bằng JavaScript thuần, HTML, CSS và Bootstrap. Ứng dụng này sử dụng localStorage của trình duyệt để lưu trữ dữ liệu, giúp dễ dàng hiểu và học các khái niệm phát triển web.

## Tính năng

- **Xác thực người dùng**: Đăng ký, đăng nhập và hồ sơ người dùng
- **Quản lý sản phẩm**: Duyệt, tìm kiếm và lọc sản phẩm
- **Giỏ hàng**: Thêm sản phẩm vào giỏ hàng, cập nhật số lượng và thanh toán
- **Quản lý đơn hàng**: Đặt hàng và xem lịch sử đơn hàng
- **Bảng quản trị**: Quản lý sản phẩm, danh mục, người dùng và đơn hàng
- **Thiết kế đáp ứng**: Hoạt động trên máy tính để bàn và thiết bị di động

## Công nghệ sử dụng

- **HTML5**: Cấu trúc của các trang web
- **CSS3**: Tạo kiểu với biến tùy chỉnh cho chủ đề
- **Bootstrap 5**: Các thành phần UI đáp ứng
- **JavaScript (ES6+)**: Lập trình phía máy khách
- **localStorage API**: Lưu trữ dữ liệu

## Cấu trúc Dự án
.
├── assets/
│   ├── css/         # Tệp CSS
│   ├── js/          # Tệp JavaScript
│   │   ├── db.js    # Quản lý dữ liệu
│   │   ├── auth.js  # Xác thực người dùng
│   │   ├── cart.js  # Giỏ hàng
│   │   ├── products.js # Quản lý sản phẩm
│   │   ├── utils.js # Các hàm tiện ích
│   │   ├── admin.js # Chức năng cho trang quản trị
│   │   └── home.js  # Chức năng trang chủ
│   ├── images/      # Hình ảnh và tài nguyên
│   └── data/        # Dữ liệu mẫu (JSON)
├── pages/
│   ├── admin/       # Các trang dành cho quản trị
│   │   ├── dashboard.html
│   │   ├── products.html
│   │   ├── categories.html
│   │   ├── orders.html
│   │   └── users.html
│   └── customer/    # Các trang dành cho khách hàng
│       ├── login.html
│       ├── register.html
│       ├── products.html
│       ├── product-detail.html
│       ├── cart.html
│       ├── orders.html
│       ├── profile.html
│       ├── about.html
│       └── contact.html
└── index.html       # Trang chủ


## Lưu trữ dữ liệu

Ứng dụng này sử dụng localStorage của trình duyệt để lưu trữ dữ liệu. Các kho dữ liệu bao gồm:
	•	products: Dữ liệu sản phẩm
	•	categories: Danh mục sản phẩm
	•	users: Tài khoản người dùng
	•	cart: Sản phẩm trong giỏ hàng
	•	orders: Thông tin đơn hàng
	•	reviews: Đánh giá sản phẩm

## Phân quyền người dùng
	•	Khách hàng (Customer): Có thể xem sản phẩm, mua hàng và quản lý hồ sơ cá nhân
	•	Nhân viên (Staff): Có quyền truy cập bảng điều khiển với khả năng hạn chế
	•	Quản trị viên (Admin): Toàn quyền sử dụng các tính năng quản trị

## Tài khoản quản trị mặc định
	•	Tên đăng nhập: admin
	•	Mật khẩu: admin123


## Mục đích học tập

Dự án này được xây dựng nhằm phục vụ mục đích học tập, minh họa cách xây dựng một ứng dụng web hoàn chỉnh chỉ sử dụng công nghệ phía client (trình duyệt). Các kỹ thuật được trình bày:
	•	JavaScript hướng đối tượng
	•	Tổ chức mã theo mô hình module
	•	Thao tác CRUD với localStorage
	•	Điều hướng phía client
	•	Kiểm tra dữ liệu nhập form
	•	Thiết kế giao diện phản hồi (responsive)
	•	Xác thực người dùng phía client

## Lời cảm ơn
	•	Bootstrap: cung cấp các thành phần giao diện
	•	Bootstrap Icons: bộ biểu tượng sử dụng
	•	Hình ảnh mẫu: từ nhiều nguồn khác nhau, chỉ dùng cho mục đích học tập