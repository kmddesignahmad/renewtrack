# RenewTrack 🔄

Subscription & Renewal Management System built with React + Cloudflare Pages + D1.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Database**: Cloudflare D1 (SQLite)

---

## 🚀 Setup & Deployment Guide (Step by Step)

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- [Git](https://git-scm.com/) installed
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)

### Step 1: Install Dependencies

Open your terminal in the project folder:

```bash
cd renewtrack
npm install
```

### Step 2: Install Wrangler CLI & Login

```bash
npm install -g wrangler
wrangler login
```

This will open your browser to authenticate with Cloudflare.

### Step 3: Create D1 Database

```bash
wrangler d1 create renewtrack_db
```

This will output something like:
```
✅ Successfully created DB 'renewtrack_db'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id`** and add it to your `wrangler.toml`:

Open `wrangler.toml` and add the database_id:

```toml
[[d1_databases]]
binding = "DB"
database_name = "renewtrack_db"
database_id = "YOUR_DATABASE_ID_HERE"   # <-- Add this line
```

### Step 4: Initialize the Database

Run the schema migration:

```bash
wrangler d1 execute renewtrack_db --remote --file=./migrations/schema.sql
```

Run the seed data:

```bash
wrangler d1 execute renewtrack_db --remote --file=./migrations/seed.sql
```

### Step 5: Build the Project

```bash
npm run build
```

### Step 6: Deploy to Cloudflare Pages

#### Option A: Deploy via Wrangler (Quick)

```bash
wrangler pages deploy dist
```

When prompted:
- Project name: `renewtrack`
- Production branch: `main`

#### Option B: Deploy via GitHub (Recommended for auto-deploy)

1. Create a new GitHub repository
2. Push your code:

```bash
git init
git add .
git commit -m "Initial RenewTrack deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/renewtrack.git
git push -u origin main
```

3. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
4. Connect your GitHub repo
5. Settings:
   - **Build command**: `npm run build`
   - **Build output**: `dist`
   - **Root directory**: `/`
6. Go to **Settings → Functions → D1 database bindings**
7. Add binding:
   - Variable name: `DB`
   - Database: `renewtrack_db`
8. Deploy!

### Step 7: Initialize Admin User

After deployment, visit your site URL and login with:

- **Username**: `admin`
- **Password**: `11071990`

The admin user is automatically created on first login.

---

## 🧪 Local Development

For local testing:

```bash
# Initialize local D1
wrangler d1 execute renewtrack_db --local --file=./migrations/schema.sql
wrangler d1 execute renewtrack_db --local --file=./migrations/seed.sql

# Build the frontend
npm run build

# Run locally with D1
npm run pages:dev
```

Then open http://localhost:8788

---

## 📁 Project Structure

```
renewtrack/
├── functions/                  # Cloudflare Pages Functions (API)
│   ├── _middleware.ts          # SPA routing middleware
│   ├── lib.ts                  # Shared helpers, auth, types
│   └── api/
│       ├── auth/
│       │   ├── init.ts         # POST /api/auth/init
│       │   ├── login.ts        # POST /api/auth/login
│       │   └── password.ts     # POST /api/auth/password
│       ├── dashboard/
│       │   └── index.ts        # GET /api/dashboard
│       ├── customers/
│       │   ├── index.ts        # GET, POST /api/customers
│       │   └── [id].ts         # GET, PUT, DELETE /api/customers/:id
│       ├── services/
│       │   ├── index.ts        # GET, POST /api/services
│       │   └── [id].ts         # PUT, DELETE /api/services/:id
│       ├── subscriptions/
│       │   ├── index.ts        # GET, POST /api/subscriptions
│       │   └── [id].ts         # GET, PUT, DELETE /api/subscriptions/:id
│       ├── renewals/
│       │   └── index.ts        # GET, POST /api/renewals
│       └── notices/
│           ├── index.ts        # GET, POST /api/notices
│           └── [uuid].ts       # GET /api/notices/:uuid (public)
├── src/                        # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── lib/api.ts              # API client
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Modal.tsx
│   │   └── StatusBadge.tsx
│   └── pages/
│       ├── LoginPage.tsx
│       ├── DashboardPage.tsx
│       ├── CustomersPage.tsx
│       ├── ServicesPage.tsx
│       ├── SubscriptionsPage.tsx
│       ├── RenewalsPage.tsx
│       ├── SettingsPage.tsx
│       └── NoticePage.tsx
├── migrations/
│   ├── schema.sql              # Database schema
│   └── seed.sql                # Default service types
├── public/
│   ├── favicon.svg
│   ├── _redirects
│   └── _routes.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── wrangler.toml
```

## 📝 Default Login

- **Username**: admin
- **Password**: 11071990

You can change the password from Settings after login.

## Features
- ✅ Customer management (CRUD)
- ✅ Service types management
- ✅ Subscription tracking with status auto-calculation
- ✅ Renewal system with 365-day extension
- ✅ Renewal logs
- ✅ Public renewal notice pages (pro-invoice style)
- ✅ Dashboard with stats
- ✅ Filters (year, month, status, sort)
- ✅ Print-friendly notices
- ✅ Responsive design
- ✅ All data persisted in D1 (no localStorage)
