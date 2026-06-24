# 🚀 TrailHive Setup & Startup Guide

## ⚡ QUICK START (Copy & Paste Commands)

### Step 1: Start Node.js Server
```bash
cd c:\Users\rohit\Downloads\trailhive\ update\ 2\trailhive
npm start
```
✅ You should see:
```
🚀 TrailHive: http://localhost:3000
🔐 Admin login: http://localhost:3000/admin-login.html
📊 Admin panel: http://localhost:3000/admin.html

👤 Username: rohit  |  🔑 Password: Trailhive@2025
✅ MongoDB connected: mongodb://127.0.0.1:27017/trailhive
```

### Step 2: Start MongoDB (in a NEW terminal/PowerShell)
```bash
mongod
```
✅ You should see: `waiting for connections on port 27017`

### Step 3: Open in Browser
- **Main Site:** http://localhost:3000
- **Admin Login:** http://localhost:3000/admin-login.html
- **Admin Dashboard:** http://localhost:3000/admin.html

---

## 📋 TROUBLESHOOTING

### ❌ "Cannot connect to server" Error
1. Check if `npm start` is running on localhost:3000
2. Open http://localhost:3000/api/health in browser
3. If error appears → Node.js server is NOT running

### ❌ "Database not showing" / "Database error"
1. Check if `mongod` is running
2. Look for error in server terminal like: `❌ MongoDB FAILED`
3. **Solution:** 
   - Ensure MongoDB is installed: https://www.mongodb.com/try/download/community
   - Run `mongod` in a separate terminal
   - Or use MongoDB Atlas (cloud): https://cloud.mongodb.com

### ❌ Admin Login Not Working
**Default Credentials:**
- Username: `rohit`
- Password: `Trailhive@2025`

If still fails:
1. Verify server is running (`npm start`)
2. Verify MongoDB is connected
3. Check .env file has correct settings
4. Open browser DevTools (F12) → Network tab → Check /api/admin/login response

---

## 🔧 CONFIGURATION

### Change Admin Credentials
Edit `.env` file:
```
ADMIN_USERNAME=yourname
ADMIN_PASSWORD=yourpassword
```
Then restart server: `npm start`

### Use MongoDB Atlas (Cloud) Instead of Local
1. Go to https://cloud.mongodb.com
2. Create free account → Create cluster → Create database user
3. Get connection string from "Connect" button
4. Paste in `.env` as `MONGO_URI`

Example:
```
MONGO_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/trailhive
```

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `server/index.js` | Backend server (Express + MongoDB) |
| `.env` | Configuration (port, credentials, database) |
| `public/admin-login.html` | Admin login page |
| `public/admin.html` | Admin dashboard (view bookings) |
| `public/index.html` | Main landing page |
| `public/register.html` | Registration + Payment page |

---

## 🔒 Security Notes

1. **Change default credentials** in `.env` before going live
2. **Use strong passwords** (min 8 chars, mix of letters/numbers/symbols)
3. **Never commit `.env`** to GitHub (already in .gitignore)
4. **Session expires** after 8 hours automatically

---

## ✅ Testing Checklist

- [ ] `npm start` shows "MongoDB connected"
- [ ] http://localhost:3000 loads homepage
- [ ] Admin login works (username: rohit, password: Trailhive@2025)
- [ ] Admin dashboard shows "MongoDB connected" status
- [ ] Database status shows ✅ (green dot)
- [ ] Can see "All Registrations" table (empty if no bookings)

---

## 🆘 Still Having Issues?

1. **Check Terminal Output:** Look for red error messages
2. **Check Browser Console:** Press F12 → Console tab → Look for errors
3. **Verify Node.js:** Run `node --version` (should be v18+)
4. **Verify MongoDB:** Run `mongod` separately in another terminal

**Common Port Issues:**
- Port 3000 already in use? Edit `.env`: `PORT=3001`
- Port 27017 (MongoDB) in use? Try another port in `.env` MONGO_URI

---

Generated: 2025
TrailHive Adventure Travel Platform
