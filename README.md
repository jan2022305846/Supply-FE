# USTP-SOIS (Supply Office Inventory System)

## Overview

USTP-SOIS is a comprehensive inventory management system designed for educational institutions. The system allows administrators to track, manage, and distribute supplies efficiently while providing faculty members with a streamlined request process.

## Features

- **User Authentication**
  - Role-based access control (Admin/Faculty)
  - JWT token authentication with auto-refresh
  - Session management

- **Inventory Management**
  - Item tracking with detailed information
  - QR code generation and scanning
  - Low stock alerts
  - Expiration date tracking
  - Item categorization

- **Request System**
  - Item request submission
  - Request approval workflow
  - Request history tracking

- **Dashboard Analytics**
  - Inventory insights
  - Request statistics
  - Activity logs

- **Mobile Responsive UI**
  - Works across devices (desktop, tablet, mobile)
  - Adaptive QR code scanning for different devices

## Technology Stack

- **Frontend**
  - React 18
  - React Router v6
  - TanStack Query (React Query)
  - Axios for API communication
  - Tailwind CSS
  - Framer Motion for animations

- **Backend**
  - Laravel API (separate repository)
  - MySQL Database

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/supply-fe.git
   cd supply-fe
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Create environment files
   ```bash
   cp .env.example .env
   ```

4. Update environment variables in `.env`
   ```
   VITE_API_URL=http://your-backend-api-url.com/api
   VITE_TOKEN_EXPIRY_DAYS=30
   VITE_SESSION_MIN_MINUTES=45
   ```

5. Start development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Build for production
   ```bash
   npm run build
   # or
   yarn build
   ```

## Deployment

### Vercel Deployment

1. Push your code to GitHub

2. Connect your GitHub repository to Vercel

3. Configure environment variables in Vercel project settings:
   - `VITE_API_URL`: Your production API URL
   - `VITE_TOKEN_EXPIRY_DAYS`: Token expiry in days
   - `VITE_SESSION_MIN_MINUTES`: Minimum session duration

4. Deploy!

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000/api` |
| `VITE_TOKEN_EXPIRY_DAYS` | JWT token expiry in days | `30` |
| `VITE_SESSION_MIN_MINUTES` | Minimum session duration in minutes | `45` |

## Project Structure

```
/
├── public/             # Static assets
├── src/
│   ├── assets/         # Images and other assets
│   ├── components/     # Reusable components
│   ├── config/         # App configuration
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Page layouts
│   ├── pages/          # Application pages
│   ├── routes/         # Route definitions
│   ├── services/       # API services
│   ├── App.jsx         # Main App component
│   └── main.jsx        # Application entry point
└── index.html          # HTML template
```

## Camera Compatibility

The QR code scanner component has been optimized for various devices:
- Standard browsers with camera access
- Mobile devices (iOS/Android)
- Special handling for Xiaomi/Redmi devices with limited browser camera API support
- Fallback methods for unsupported devices

## License

[MIT License](LICENSE)

## Contributors

- [janny Abu-abu](https://github.com/jan2022305846) - Developer

---

© 2023 USTP-SOIS. All Rights Reserved.