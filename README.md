# StockFlow — SaaS Inventory Management System

**StockFlow** is a modern, full-stack, multi-tenant SaaS inventory management system designed for small and medium businesses. It provides real-time inventory tracking, strict organization-level data isolation, customizable low-stock threshold alerts, and inventory CRUD operations.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS, React Router DOM v6, Axios, Lucide React icons
- **Backend**: Node.js, Express.js REST API, JSON Web Token (JWT) authentication, bcryptjs password hashing, cookie-parser, CORS
- **Database**: SQLite (via Prisma ORM and Prisma Migrations)
- **Automated Testing**: Node.js built-in test runner (`node:test`, `node:assert/strict`) & Supertest

---

## 2. Project Architecture & Directory Structure

```text
stockflow/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # Reusable UI components (Sidebar, StockStatusBadge, ConfirmDialog, etc.)
│   │   ├── context/            # AuthContext (session state) and ToastContext (notifications)
│   │   ├── layouts/            # AppLayout (navigation shell & responsive mobile drawer)
│   │   ├── pages/              # Login, Signup, Dashboard, Products, CreateProduct, EditProduct, Settings, NotFound
│   │   ├── services/           # Axios API client configured with credentials
│   │   ├── App.jsx             # React Router routing & ProtectedRoute
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js          # Vite config with /api reverse proxy to backend
│   └── package.json
│
├── server/                     # Backend Express.js REST API
│   ├── src/
│   │   ├── controllers/        # Request handlers (auth, product, dashboard, settings)
│   │   ├── services/           # Business logic & low-stock calculation rules
│   │   ├── middleware/         # requireAuth (JWT cookie verification) & centralized errorHandler
│   │   ├── lib/                # Prisma client & JWT helpers
│   │   ├── routes/             # Express Routers for /api/auth, /api/products, /api/dashboard, /api/settings
│   │   ├── app.js              # Express app setup and middleware configuration
│   │   └── server.js           # Server entry point (starts listener)
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma schema (Organization, User, Product models)
│   │   └── migrations/         # Applied SQLite database migrations
│   ├── tests/                  # Automated integration test suites
│   │   ├── auth.test.js
│   │   ├── products.test.js
│   │   ├── dashboard_settings.test.js
│   │   └── tenant_isolation.test.js
│   ├── .env.example
│   └── package.json
│
├── package.json                # Root orchestration scripts
├── .gitignore
└── README.md
```

---

## 3. Database Schema

The SQLite database is managed with Prisma ORM:

### `Organization`
- `id` (String, cuid, Primary Key)
- `name` (String)
- `defaultLowStockThreshold` (Int, default `5`)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- *Relations*: `users`, `products`

### `User`
- `id` (String, cuid, Primary Key)
- `email` (String, Unique)
- `passwordHash` (String)
- `organizationId` (String, Foreign Key referencing `Organization.id`)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### `Product`
- `id` (String, cuid, Primary Key)
- `organizationId` (String, Foreign Key referencing `Organization.id`)
- `name` (String)
- `sku` (String)
- `description` (String, Optional)
- `quantityOnHand` (Int, default `0`)
- `costPrice` (Float, Optional)
- `sellingPrice` (Float, Optional)
- `lowStockThreshold` (Int, Optional custom threshold)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- **Constraints**: Composite unique constraint `@@unique([organizationId, sku])` prevents duplicate SKUs within the same organization, while allowing different organizations to reuse standard industry SKUs.
- **Indexes**: `@@index([organizationId])`, `@@index([organizationId, name])`.

---

## 4. Multi-Tenant Data Isolation Strategy

Tenant isolation is enforced strictly on the server:
1. **Zero Client Trust**: The server **never** reads `organizationId` from request bodies, query params, or client headers.
2. **Context-Derived Ownership**: Every authenticated request validates the signed JWT in the HTTP-only cookie and resolves the user and their associated `organizationId`.
3. **Scoped Queries**:
   - `GET /api/products` filters by `where: { organizationId }`.
   - `POST /api/products` assigns `organizationId: req.user.organizationId`.
   - `GET /api/products/:id`, `PUT /api/products/:id`, and `DELETE /api/products/:id` scope directly by `{ id, organizationId }`. Any attempt to access, modify, or delete a product belonging to another tenant returns `404 Not Found` (preventing ID enumeration).
   - Dashboard statistics and settings calculations are strictly scoped to the authenticated organization.

---

## 5. Automated Low-Stock Business Logic

An item's effective threshold is determined dynamically:
- **Product-Specific Threshold**: If `product.lowStockThreshold` is set, it overrides the organization default.
- **Organization Default Threshold**: If `product.lowStockThreshold` is `null` or empty, it inherits `organization.defaultLowStockThreshold`.

A product is flagged as **Low Stock** when:
$$\text{quantityOnHand} \le \text{effectiveLowStockThreshold}$$

**Example Scenarios (with default threshold = 5):**
| Product | Qty on Hand | Custom Threshold | Effective Threshold | Status |
| :--- | :---: | :---: | :---: | :---: |
| Item A | 0 | None (null) | 5 | **Low Stock** (0 ≤ 5) |
| Item B | 3 | None (null) | 5 | **Low Stock** (3 ≤ 5) |
| Item C | 5 | None (null) | 5 | **Low Stock** (5 ≤ 5) |
| Item D | 6 | None (null) | 5 | **In Stock** (6 > 5) |
| Item E | 8 | 10 | 10 | **Low Stock** (8 ≤ 10, override) |

When the owner updates the organization's default threshold on the **Settings** page, all items inheriting the default are immediately re-evaluated.

---

## 6. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Step 1: Install Backend Dependencies & Configure Environment

```bash
cd server
npm install
cp .env.example .env
```

Ensure `server/.env` contains:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="stockflow-super-secret-jwt-key-2026-production-grade"
CLIENT_URL="http://localhost:5173"
```

### Step 2: Initialize Database and Run Prisma Migrations

```bash
# Still inside /server:
npx prisma generate
npx prisma migrate dev --name init
```

### Step 3: Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## 7. Running the Application

### Start the Backend Server (Port 5000)
```bash
cd server
npm run dev
# Server runs at http://localhost:5000
```

### Start the Frontend Client (Port 5173)
```bash
cd client
npm run dev
# Client runs at http://localhost:5173
```

Open your browser at **http://localhost:5173**.

---

## 8. REST API Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Registers organization & owner; sets HTTP-only JWT cookie | No |
| `POST` | `/api/auth/login` | Authenticates user; sets HTTP-only JWT cookie | No |
| `POST` | `/api/auth/logout` | Clears authentication cookie | No |
| `GET` | `/api/auth/me` | Returns current authenticated user and organization | Yes |

### Dashboard
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/dashboard` | Returns total products, total stock units, low-stock count, and low-stock table | Yes |

### Products
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/products` | Lists products with stock status (supports `?search=` filter) | Yes |
| `GET` | `/api/products/:id` | Returns single product scoped to tenant | Yes |
| `POST` | `/api/products` | Creates product for authenticated organization | Yes |
| `PUT` | `/api/products/:id` | Updates product details and stock quantity | Yes |
| `DELETE` | `/api/products/:id` | Deletes product scoped to tenant | Yes |

### Settings
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/settings` | Returns organization settings and default threshold | Yes |
| `PUT` | `/api/settings` | Updates default low-stock threshold | Yes |

---

## 9. Automated Testing

StockFlow includes 23 automated integration tests verifying:
- Authentication, validation, and session handling
- Product CRUD operations, quantity updates, and search
- Duplicate SKU rejection within tenant and allowance across tenants
- Low-stock calculations and threshold overrides
- Strict multi-tenant isolation and cross-tenant access rejection

To run the automated tests:
```bash
cd server
npm test
```

