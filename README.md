# Moji Gift Shop - Web Application

A client-side gift shop web application built with vanilla JavaScript, HTML, CSS, and Bootstrap. This application uses the browser's localStorage for data persistence, making it easy to understand and learn web development concepts.

## Features

- **User Authentication**: Register, login, and user profiles
- **Product Management**: Browse, search, and filter products
- **Shopping Cart**: Add products to cart, update quantities, and checkout
- **Order Management**: Place orders and view order history
- **Admin Panel**: Manage products, categories, users, and orders
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **HTML5**: Structure of the web pages
- **CSS3**: Styling with custom variables for theming
- **Bootstrap 5**: Responsive UI components
- **JavaScript (ES6+)**: Client-side programming
- **localStorage API**: Data persistence

## Project Structure

```
.
├── assets/
│   ├── css/         # CSS stylesheets
│   ├── js/          # JavaScript files
│   │   ├── db.js    # Database management
│   │   ├── auth.js  # Authentication
│   │   ├── cart.js  # Shopping cart
│   │   ├── products.js # Product management
│   │   ├── utils.js # Utility functions
│   │   ├── admin.js # Admin panel functionality
│   │   └── home.js  # Homepage functionality
│   ├── images/      # Images and assets
│   └── data/        # Sample data (JSON)
├── pages/
│   ├── admin/       # Admin pages
│   │   ├── dashboard.html
│   │   ├── products.html
│   │   ├── categories.html
│   │   ├── orders.html
│   │   └── users.html
│   └── customer/    # Customer pages
│       ├── login.html
│       ├── register.html
│       ├── products.html
│       ├── product-detail.html
│       ├── cart.html
│       ├── orders.html
│       ├── profile.html
│       ├── about.html
│       └── contact.html
└── index.html       # Homepage
```

## How to Run

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Open the project in a web server or using a live server extension (like Live Server in VS Code).

3. Navigate to `index.html` in your browser.

## Data Storage

This application uses the browser's localStorage for data persistence. The following data stores are used:

- **products**: Product data
- **categories**: Product categories
- **users**: User accounts
- **cart**: Shopping cart items
- **orders**: Order information
- **reviews**: Product reviews

## User Roles

- **Customer**: Can browse products, make purchases, and manage their profile
- **Staff**: Can access admin panel with limited capabilities
- **Admin**: Has full access to all admin features

## Default Admin Account

- **Username**: admin
- **Password**: admin123

## Learning Purpose

This project is designed for educational purposes to demonstrate how to build a complete web application using only client-side technologies. It showcases:

- Object-oriented JavaScript
- Module pattern for code organization
- CRUD operations with localStorage
- Client-side routing
- Form validation
- Responsive UI design
- User authentication (client-side)

## License

This project is free for educational use.

## Acknowledgements

- Bootstrap for the UI components
- Bootstrap Icons for the icon set
- Sample images from various sources for educational purposes 