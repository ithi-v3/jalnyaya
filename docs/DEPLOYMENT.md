# 🚀 JalNyaya — Deployment Guide

> Step-by-step instructions to deploy the JalNyaya application for free.

**Architecture:** React frontend (Vercel) → Node.js backend (Render) → MySQL database (Aiven/Railway)

---

## 1. Database Deployment (Aiven MySQL — Free Tier)

Deploy the database first so you have the connection string ready for the backend.

### Option A: Aiven (Recommended)

1. Sign up at [aiven.io](https://aiven.io) — use GitHub login
2. Create a **MySQL** service → select the **Free** plan
3. Choose the region closest to you
4. Wait for the service to be **Running** (1–2 min)
5. Copy the **Service URI** from the dashboard — it looks like:
   ```
   mysql://avnadmin:PASSWORD@host.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED
   ```

### Option B: Railway

1. Sign up at [railway.app](https://railway.app)
2. Click **New Project → Provision MySQL**
3. Go to the **Variables** tab → copy `DATABASE_URL`

### Option C: PlanetScale

1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a database → copy the connection string from **Connect → Node.js**

### Initialize the Database

From your local machine (with the `DATABASE_URL` set):

```bash
cd backend

# Set the connection string
export DATABASE_URL="mysql://avnadmin:PASSWORD@host:port/defaultdb"

# Push Prisma schema
npx prisma db push

# Seed initial data
npx prisma db seed
```

Then apply the SQL files for views, procedures, triggers, and indexes:

```bash
# Connect via mysql CLI or use a GUI tool like DBeaver/TablePlus
mysql -h HOST -P PORT -u USER -p DATABASE < prisma/sql/views.sql
mysql -h HOST -P PORT -u USER -p DATABASE < prisma/sql/procedures.sql
mysql -h HOST -P PORT -u USER -p DATABASE < prisma/sql/triggers.sql
mysql -h HOST -P PORT -u USER -p DATABASE < prisma/sql/indexes.sql
```

> **Tip:** If you don't have the `mysql` CLI, paste the SQL file contents into Aiven's **Query Editor** or any MySQL GUI client.

---

## 2. Backend Deployment (Render — Free Tier)

1. Sign up at [render.com](https://render.com) — use GitHub login
2. Click **New → Web Service**
3. Connect your GitHub repo (authorize Render if prompted)
4. Configure the service:

| Setting          | Value                |
| ---------------- | -------------------- |
| **Name**         | `jalnyaya-api`       |
| **Root Directory**| `backend`           |
| **Runtime**      | `Node`               |
| **Build Command**| `npm install`        |
| **Start Command**| `node src/server.js` |

5. Set **Environment Variables** (under the "Environment" tab):

| Variable         | Value                                              |
| ---------------- | -------------------------------------------------- |
| `DATABASE_URL`   | Your MySQL connection string from Step 1            |
| `JWT_SECRET`     | A random string (e.g., `myproject-secret-key-2024`) |
| `JWT_EXPIRES_IN` | `7d`                                                |
| `NODE_ENV`       | `production`                                        |
| `PORT`           | `10000`                                             |
| `FRONTEND_URL`   | `https://jalnyaya.vercel.app` (update after frontend deploy) |

6. Click **Create Web Service** → wait for the build to finish
7. Note your backend URL: `https://jalnyaya-api.onrender.com`

> **⚠️ Free Tier Note:** Render free services spin down after 15 min of inactivity. The first request after idle takes ~30 seconds. This is normal for a student project.

---

## 3. Frontend Deployment (Vercel — Free Tier)

1. Sign up at [vercel.com](https://vercel.com) — use GitHub login
2. Click **Add New → Project** → import your GitHub repo
3. Configure the project:

| Setting             | Value                                          |
| ------------------- | ---------------------------------------------- |
| **Framework Preset**| `Vite`                                          |
| **Root Directory**  | `frontend`                                      |
| **Build Command**   | `npm run build`                                 |
| **Output Directory**| `dist`                                          |

4. Add **Environment Variable**:

| Variable             | Value                                      |
| -------------------- | ------------------------------------------ |
| `VITE_API_BASE_URL`  | `https://jalnyaya-api.onrender.com/api`    |

5. Click **Deploy** → wait for the build (usually under 1 min)
6. Your frontend is live at: `https://jalnyaya.vercel.app` (or similar)

> **Note:** Go back to Render and update `FRONTEND_URL` to match your actual Vercel URL.

---

## 4. Post-Deployment Checklist

- [ ] **CORS:** Verify `FRONTEND_URL` in Render matches your Vercel domain exactly (no trailing slash)
- [ ] **API Test:** Open `https://your-backend.onrender.com/api/health` — should return `200 OK`
- [ ] **Login:** Test login with a seeded user account
- [ ] **Role-Based Access:** Verify that admin, judge, lawyer, and citizen roles see the correct dashboards
- [ ] **Database:** Check that cases, hearings, and other data load properly
- [ ] **Environment Variables:** Double-check no variable has leading/trailing spaces

### Quick Debugging

| Problem                     | Fix                                                       |
| --------------------------- | --------------------------------------------------------- |
| CORS errors in browser      | Check `FRONTEND_URL` on Render — must match Vercel domain |
| API returns 500             | Check Render logs → usually a `DATABASE_URL` issue        |
| Login fails                 | Verify `JWT_SECRET` is set and `db seed` ran successfully |
| Frontend shows blank page   | Check `VITE_API_BASE_URL` — must include `/api`           |
| Render deploy fails         | Check `Root Directory` is set to `backend`                |

---

## 5. Live URL

```
🌐 Live URL: [To be updated after deployment]
```

---

## 6. Docker Hub (Optional)

If you want to containerize and publish the app:

```bash
# Build the Docker image
docker build -t jalnyaya .

# Tag for Docker Hub
docker tag jalnyaya username/jalnyaya:latest

# Login and push
docker login
docker push username/jalnyaya:latest
```

> **Note:** Replace `username` with your actual Docker Hub username.

To run from Docker Hub:

```bash
docker pull username/jalnyaya:latest
docker run -p 3000:3000 --env-file .env username/jalnyaya:latest
```

---

## Summary

| Component  | Platform | URL                                         | Cost  |
| ---------- | -------- | ------------------------------------------- | ----- |
| Frontend   | Vercel   | `https://jalnyaya.vercel.app`               | Free  |
| Backend    | Render   | `https://jalnyaya-api.onrender.com`         | Free  |
| Database   | Aiven    | MySQL connection string (private)            | Free  |

All three platforms offer generous free tiers — more than enough for a B.Tech project demo.
