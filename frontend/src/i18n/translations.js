const translations = {
  en: {
    // Navbar
    nav_home: 'Home',
    nav_orders: 'My Orders',
    nav_login: 'Login',
    nav_register: 'Register',
    nav_logout: 'Logout',
    nav_cart: 'Cart',

    // Hero
    hero_title_1: 'Premium Tech,',
    hero_title_2: 'Secured.',
    hero_subtitle: 'Explore our curated collection of cutting-edge electronics with enterprise-grade security.',
    hero_search_placeholder: 'Search products...',

    // Products
    products_title: 'All Products',
    products_add_to_cart: 'Add to Cart',
    products_view: 'View Details',
    products_in_stock: 'In Stock',
    products_out_of_stock: 'Out of Stock',
    products_reviews: 'reviews',
    products_description: 'Description',
    products_customer_reviews: 'Customer Reviews',
    products_no_results: 'No products found',

    // Cart
    cart_title: 'Shopping Cart',
    cart_empty: 'Your cart is empty',
    cart_empty_subtitle: 'Add some products to get started!',
    cart_total: 'Total',
    cart_checkout: 'Proceed to Checkout',
    cart_remove: 'Remove',
    cart_continue: 'Continue Shopping',

    // Checkout
    checkout_title: 'Checkout',
    checkout_shipping: 'Shipping Information',
    checkout_payment: 'Payment Method',
    checkout_card_number: 'Card Number',
    checkout_card_holder: 'Card Holder Name',
    checkout_expiry: 'Expiry Date',
    checkout_cvv: 'CVV',
    checkout_address: 'Shipping Address',
    checkout_phone: 'Phone Number',
    checkout_place_order: 'Place Order',
    checkout_order_summary: 'Order Summary',
    checkout_subtotal: 'Subtotal',
    checkout_shipping_fee: 'Shipping',
    checkout_free: 'Free',
    checkout_success: 'Order placed successfully!',
    checkout_saved_cards: 'Saved Cards',
    checkout_use_new_card: 'Use a new card',

    // Orders
    orders_title: 'My Orders',
    orders_empty: 'No orders yet',
    orders_empty_subtitle: 'Start shopping to see your orders here.',
    orders_id: 'Order',
    orders_date: 'Date',
    orders_status: 'Status',
    orders_total: 'Total',
    orders_items: 'items',
    orders_shipping_to: 'Shipping to',
    orders_phone: 'Phone',

    // Order Status
    status_confirmed: 'Confirmed',
    status_shipped: 'Shipped',
    status_delivered: 'Delivered',
    status_cancelled: 'Cancelled',

    // Auth
    login_title: 'Welcome back',
    login_subtitle: 'Sign in to your account',
    login_email: 'Email',
    login_password: 'Password',
    login_button: 'Sign In',
    login_no_account: "Don't have an account?",
    login_register_link: 'Create one',
    login_error: 'Invalid email or password',

    register_title: 'Create account',
    register_subtitle: 'Join Security Shop today',
    register_username: 'Username',
    register_email: 'Email',
    register_password: 'Password',
    register_phone: 'Phone Number',
    register_address: 'Address',
    register_button: 'Create Account',
    register_has_account: 'Already have an account?',
    register_login_link: 'Sign in',

    // Chat
    chat_title: 'AI Assistant',
    chat_placeholder: 'Ask me about products...',
    chat_greeting: 'Hi! I\'m the Security Shop AI assistant. Ask me about any product!',

    // Mode
    mode_base: 'Base',
    mode_secure: 'Secure',
    mode_current: 'Current Mode',
    mode_description_base: 'Realistic v1.0 code — vulnerable to attacks',
    mode_description_secure: 'Defense-in-depth — all security layers active',

    // Security Panel
    security_title: 'Security Layers',
    security_active: 'Active',
    security_inactive: 'Inactive',
    security_layer: 'Layer',

    // SQLi
    sqli_title: 'SQL Injection Defense',
    sqli_layer1: 'Parameterized ORM queries',
    sqli_layer2: 'Input validation & sanitization',
    sqli_layer3: 'Database-level access control',
    sqli_base_desc: 'Raw string concatenation in SQL queries',

    // IDOR
    idor_title: 'IDOR Defense',
    idor_layer1: 'UUID-based resource identifiers',
    idor_layer2: 'Ownership verification on every request',
    idor_layer3: 'Data masking for sensitive fields',
    idor_base_desc: 'Sequential integer IDs with no ownership check',

    // Prompt Injection
    prompt_title: 'Prompt Injection Defense',
    prompt_layer1: 'XML-tagged prompt boundaries',
    prompt_layer2: 'Output guardrails (URL/phrase filtering)',
    prompt_layer3: 'Content sanitization for user inputs',
    prompt_base_desc: 'Raw review text injected into prompts',

    // General
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try Again',
    back: 'Go Back',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    or: 'or',
  },

  vi: {
    // Navbar
    nav_home: 'Trang chủ',
    nav_orders: 'Đơn hàng',
    nav_login: 'Đăng nhập',
    nav_register: 'Đăng ký',
    nav_logout: 'Đăng xuất',
    nav_cart: 'Giỏ hàng',

    // Hero
    hero_title_1: 'Công nghệ cao cấp,',
    hero_title_2: 'Bảo mật tối đa.',
    hero_subtitle: 'Khám phá bộ sưu tập thiết bị điện tử hàng đầu với hệ thống bảo mật cấp doanh nghiệp.',
    hero_search_placeholder: 'Tìm kiếm sản phẩm...',

    // Products
    products_title: 'Tất cả sản phẩm',
    products_add_to_cart: 'Thêm vào giỏ',
    products_view: 'Xem chi tiết',
    products_in_stock: 'Còn hàng',
    products_out_of_stock: 'Hết hàng',
    products_reviews: 'đánh giá',
    products_description: 'Mô tả',
    products_customer_reviews: 'Đánh giá khách hàng',
    products_no_results: 'Không tìm thấy sản phẩm',

    // Cart
    cart_title: 'Giỏ hàng',
    cart_empty: 'Giỏ hàng trống',
    cart_empty_subtitle: 'Hãy thêm sản phẩm vào giỏ hàng!',
    cart_total: 'Tổng cộng',
    cart_checkout: 'Thanh toán',
    cart_remove: 'Xóa',
    cart_continue: 'Tiếp tục mua sắm',

    // Checkout
    checkout_title: 'Thanh toán',
    checkout_shipping: 'Thông tin giao hàng',
    checkout_payment: 'Phương thức thanh toán',
    checkout_card_number: 'Số thẻ',
    checkout_card_holder: 'Tên chủ thẻ',
    checkout_expiry: 'Ngày hết hạn',
    checkout_cvv: 'CVV',
    checkout_address: 'Địa chỉ giao hàng',
    checkout_phone: 'Số điện thoại',
    checkout_place_order: 'Đặt hàng',
    checkout_order_summary: 'Tóm tắt đơn hàng',
    checkout_subtotal: 'Tạm tính',
    checkout_shipping_fee: 'Phí vận chuyển',
    checkout_free: 'Miễn phí',
    checkout_success: 'Đặt hàng thành công!',
    checkout_saved_cards: 'Thẻ đã lưu',
    checkout_use_new_card: 'Dùng thẻ mới',

    // Orders
    orders_title: 'Đơn hàng của tôi',
    orders_empty: 'Chưa có đơn hàng',
    orders_empty_subtitle: 'Hãy mua sắm để xem đơn hàng tại đây.',
    orders_id: 'Đơn hàng',
    orders_date: 'Ngày đặt',
    orders_status: 'Trạng thái',
    orders_total: 'Tổng',
    orders_items: 'sản phẩm',
    orders_shipping_to: 'Giao đến',
    orders_phone: 'Số điện thoại',

    // Order Status
    status_confirmed: 'Đã xác nhận',
    status_shipped: 'Đang giao',
    status_delivered: 'Đã giao',
    status_cancelled: 'Đã hủy',

    // Auth
    login_title: 'Chào mừng trở lại',
    login_subtitle: 'Đăng nhập vào tài khoản',
    login_email: 'Email',
    login_password: 'Mật khẩu',
    login_button: 'Đăng nhập',
    login_no_account: 'Chưa có tài khoản?',
    login_register_link: 'Đăng ký ngay',
    login_error: 'Email hoặc mật khẩu không chính xác',

    register_title: 'Tạo tài khoản',
    register_subtitle: 'Tham gia Security Shop hôm nay',
    register_username: 'Tên người dùng',
    register_email: 'Email',
    register_password: 'Mật khẩu',
    register_phone: 'Số điện thoại',
    register_address: 'Địa chỉ',
    register_button: 'Tạo tài khoản',
    register_has_account: 'Đã có tài khoản?',
    register_login_link: 'Đăng nhập',

    // Chat
    chat_title: 'Trợ lý AI',
    chat_placeholder: 'Hỏi về sản phẩm...',
    chat_greeting: 'Xin chào! Tôi là trợ lý AI của Security Shop. Hãy hỏi tôi về bất kỳ sản phẩm nào!',

    // Mode
    mode_base: 'Base',
    mode_secure: 'Secure',
    mode_current: 'Chế độ hiện tại',
    mode_description_base: 'Code v1.0 thực tế — dễ bị tấn công',
    mode_description_secure: 'Phòng thủ nhiều lớp — tất cả lớp bảo mật hoạt động',

    // Security Panel
    security_title: 'Các lớp bảo mật',
    security_active: 'Hoạt động',
    security_inactive: 'Không hoạt động',
    security_layer: 'Lớp',

    // SQLi
    sqli_title: 'Phòng chống SQL Injection',
    sqli_layer1: 'Truy vấn tham số hóa qua ORM',
    sqli_layer2: 'Kiểm tra & lọc đầu vào',
    sqli_layer3: 'Kiểm soát quyền truy cập database',
    sqli_base_desc: 'Ghép chuỗi trực tiếp trong truy vấn SQL',

    // IDOR
    idor_title: 'Phòng chống IDOR',
    idor_layer1: 'Sử dụng UUID thay vì số thứ tự',
    idor_layer2: 'Xác minh quyền sở hữu mỗi request',
    idor_layer3: 'Ẩn dữ liệu nhạy cảm (masking)',
    idor_base_desc: 'ID số nguyên tuần tự, không kiểm tra quyền sở hữu',

    // Prompt Injection
    prompt_title: 'Phòng chống Prompt Injection',
    prompt_layer1: 'Đánh dấu ranh giới prompt bằng XML',
    prompt_layer2: 'Lọc đầu ra (URL/cụm từ nguy hiểm)',
    prompt_layer3: 'Làm sạch nội dung đầu vào người dùng',
    prompt_base_desc: 'Nội dung đánh giá được chèn trực tiếp vào prompt',

    // General
    loading: 'Đang tải...',
    error: 'Đã xảy ra lỗi',
    retry: 'Thử lại',
    back: 'Quay lại',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    confirm: 'Xác nhận',
    close: 'Đóng',
    or: 'hoặc',
  },
};

export default translations;
