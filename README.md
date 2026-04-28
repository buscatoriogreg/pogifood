# PogiFood - MIT107 Project

## Architecture

| Layer | Tech | URL |
|-------|------|-----|
| Web Admin Panel | React + Vite + Tailwind | https://mit107.revosysinc.com/ |
| REST API | Node.js + Express | https://mit107.revosysinc.com/api/ |
| Mobile App | React Native + Expo | Scan QR with Expo Go |
| Database | MySQL 8 | pogifood database |

## Project Structure

```
mit107/
├── backend/        # Express REST API (port 3003)
├── web/            # React admin panel (restaurant owners)
├── mobile/         # React Native Expo app (customers)
└── database/       # schema.sql
```

## API Endpoints

### Auth
- POST /api/auth/register         — Customer registration
- POST /api/auth/owner/register   — Owner + restaurant registration
- POST /api/auth/login            — Login (both roles)
- GET  /api/auth/profile          — Get profile
- PUT  /api/auth/profile          — Update profile

### Restaurants (public)
- GET /api/restaurants            — List all open restaurants
- GET /api/restaurants/:id        — Restaurant + menu
- GET /api/restaurants/categories — Food categories

### Owner (requires owner JWT)
- GET /api/restaurants/my         — My restaurant
- PUT /api/restaurants/my         — Update restaurant

### Food Items
- GET  /api/food-items/search?q=  — Search food
- POST /api/food-items            — Create (owner)
- PUT  /api/food-items/:id        — Update (owner)
- DELETE /api/food-items/:id      — Delete (owner)

### Cart (customer)
- GET    /api/cart      — View cart
- POST   /api/cart      — Add item
- PUT    /api/cart/:id  — Update quantity
- DELETE /api/cart/:id  — Remove item

### Orders
- POST /api/orders             — Place order (customer)
- GET  /api/orders/my          — Customer order history
- GET  /api/orders/my/:id      — Order detail + status
- GET  /api/orders/owner       — All orders (owner)
- PUT  /api/orders/owner/:id/status — Update status (owner)

## Order Status Flow
pending → confirmed → preparing → out_for_delivery → delivered
(can be cancelled at any stage)

## Mobile App Setup

```bash
cd mobile
npm start        # starts Expo dev server
# Scan QR with Expo Go app on phone
```

## Deploy Commands

```bash
# Rebuild web app
cd web && npm run build

# Restart backend
pm2 restart pogifood-api

# View logs
pm2 logs pogifood-api
```
