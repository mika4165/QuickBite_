# QuickBite - Smart Meal Pre-Order System

## Overview
QuickBite is a comprehensive meal pre-order system designed for school canteens with a **payment-first workflow**. Students browse stores, select meals, pay via GCash QR code (upload payment proof), and staff confirms orders before pickup. The system includes real-time per-order messaging, store reviews, and a staff portal for order management.

## Key Features - All Working ✅

1. **Student Flow**
   - Browse stores with ratings and images
   - Store-first ordering (select store → view menu)
   - Add meals to cart with pickup time selection
   - **GCash QR Code Payment**: Scan QR code, upload payment screenshot
   - Track order status and communicate with staff
   - Rate stores (1-5 stars with comments)

2. **Staff Portal**
   - Apply to work at any store via `/staff-signup`
   - Upload/manage store GCash QR code
   - View pending orders organized by pickup time
   - Verify payment proofs before confirming
   - Real-time messaging with customers per order
   - Manage menu items with images and availability

3. **Core System**
   - Replit Auth for secure login
   - Real-time messaging between students & staff (per order)
   - Order status tracking (Pending → Confirmed → Ready → Claimed)
   - File uploads for QR codes, payment proofs, meal images

## Architecture

### Tech Stack
- **Frontend**: React with TypeScript, Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Cart)
│   │   ├── hooks/         # Custom hooks (useAuth, useCart)
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Page components
├── server/                # Backend Express server
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   ├── replitAuth.ts     # Authentication setup
│   └── seed.ts           # Database seeding script
└── shared/               # Shared code between frontend and backend
    └── schema.ts         # Database schema and types
```

## Database Schema
- **users**: User accounts with role (student/staff)
- **stores**: Canteen stores with images, QR codes
- **meals**: Menu items for each store
- **orders**: Customer orders with status tracking
- **orderItems**: Individual items in each order
- **ratings**: Store reviews and ratings
- **messages**: Real-time messaging per order
- **sessions**: Authentication sessions

## Payment-First Workflow (Core Innovation)

1. **Student Places Order**
   - Browse stores → Select store → Browse menu → Add to cart
   - Choose pickup time and confirm
   - Go to checkout

2. **GCash Payment Step** (CRITICAL)
   - See store's GCash QR code
   - Scan and send payment amount
   - Take screenshot of proof (transaction ID visible)
   - Upload payment proof screenshot

3. **Staff Verification**
   - Staff sees order with "payment_submitted" status
   - Verifies payment proof screenshot
   - Confirms order → Status changes to "confirmed"
   
4. **Fulfillment**
   - Order moves to "ready" when prepared
   - Student picks up → Order marked "claimed"

## Real-Time Features

- **Per-Order Messaging**: Students & staff can chat about each order
- **Live Order Tracking**: Status updates in real-time
- **Instant Notifications**: Auto-refresh every 3-5 seconds

## API Endpoints

### Authentication
- `GET /api/login` - Initiate login
- `GET /api/callback` - OAuth callback
- `GET /api/logout` - Logout
- `GET /api/auth/user` - Get current user

### Stores
- `GET /api/stores` - List all stores
- `GET /api/stores/:id` - Get store details
- `GET /api/stores/:id/meals` - Get store menu
- `GET /api/stores/:id/reviews` - Get store reviews
- `POST /api/stores/:id/reviews` - Submit review

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `GET /api/orders/:id/messages` - Get order messages
- `POST /api/orders/:id/messages` - Send message

### Staff
- `GET /api/staff/store` - Get assigned store
- `GET /api/staff/orders` - Get store orders
- `GET /api/staff/meals` - Get store menu
- `PATCH /api/staff/orders/:id/status` - Update order status
- `POST /api/staff/meals` - Add menu item
- `PATCH /api/staff/meals/:id` - Update menu item

### Upload
- `POST /api/upload` - Upload image (QR codes, payment proofs)

## Order Status Flow
1. `pending_payment` - Order created, awaiting payment
2. `payment_submitted` - Payment proof uploaded
3. `confirmed` - Staff verified payment
4. `ready` - Order ready for pickup
5. `claimed` - Order picked up

## Development

### Running Locally
The application runs automatically with `npm run dev` which starts both the backend and frontend.

### Database
- Push schema changes: `npm run db:push`
- Seed sample data: `npx tsx server/seed.ts`

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit application ID (for OAuth)
