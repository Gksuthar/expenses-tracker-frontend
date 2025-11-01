# 🚨 URGENT: Update Vercel Environment Variable

## Problem
Frontend is calling OLD backend URL:
- ❌ Calling: `https://expenses-tracker-backend-2-9z66.onrender.com`
- ✅ Should call: `https://expenses-tracker-backend-5-dlni.onrender.com`

---

## Fix - Update Vercel Environment Variable

### Step 1: Go to Vercel Dashboard
https://vercel.com/dashboard

### Step 2: Select Your Project
Click on: **expenses-tracker-frontend-mu7x**

### Step 3: Go to Settings
Click **"Settings"** tab at top

### Step 4: Click Environment Variables
In left sidebar, click **"Environment Variables"**

### Step 5: Find VITE_API_BASE_URL
Look for: `VITE_API_BASE_URL`

### Step 6: Edit the Variable
Click the **"..."** (three dots) → **"Edit"**

Change value from:
```
❌ https://expenses-tracker-backend-2-9z66.onrender.com/api
```

To:
```
✅ https://expenses-tracker-backend-5-dlni.onrender.com/api
```

### Step 7: Save
Click **"Save"**

### Step 8: Redeploy
1. Go to **"Deployments"** tab
2. Find latest deployment
3. Click **"..."** → **"Redeploy"**
4. Confirm

---

## OR - Push Client Changes to Trigger Auto Deploy

Your local `.env` is already correct:
```
VITE_API_BASE_URL="https://expenses-tracker-backend-5-dlni.onrender.com/api"
```

You can make a small change to trigger Vercel to rebuild:

```bash
cd client
git add .env
git commit -m "Update API URL to new backend"
git push origin main
```

Vercel will auto-deploy with new environment variable.

---

## After Fix, Browser Console Should Show:

```
✅ GET https://expenses-tracker-backend-5-dlni.onrender.com/api/user/current
✅ Status: 200 OK
✅ No CORS errors
```
