# Vercel Deployment Guide

This guide will help you deploy your backend API to Vercel without errors.

## ⚠️ Important: Database IP Whitelisting

**CRITICAL:** Your SQL Server at `103.98.12.218:59320` likely has firewall rules that only allow specific IPs. Vercel uses dynamic IP addresses, so you have two options:

### Option 1: Whitelist Vercel IP Ranges (Recommended)
1. Contact Vercel support or check their documentation for current IP ranges
2. Whitelist all Vercel IP ranges in your SQL Server firewall
3. This allows all Vercel deployments to connect

### Option 2: Use a Database Proxy (Advanced)
1. Deploy a small proxy server on a VPS with a static IP
2. Whitelist the VPS IP in SQL Server
3. Configure backend to connect through the proxy

---

## Step-by-Step Deployment

### Prerequisites
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Backend code pushed to GitHub
- [ ] SQL Server IP whitelisting configured (see above)

---

### Step 1: Prepare Your Code

1. **Ensure all files are committed to Git:**
   ```bash
   cd backend
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Verify these files exist:**
   - ✅ `vercel.json` (configuration file)
   - ✅ `api/index.js` (serverless entry point)
   - ✅ `src/server.js` (Express app)
   - ✅ `package.json` (with dependencies)

---

### Step 2: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended for easy deployment)
4. Authorize Vercel to access your GitHub repositories

---

### Step 3: Deploy Backend to Vercel

1. **Import Project:**
   - Click **"Add New"** → **"Project"**
   - Select your GitHub repository
   - Choose the repository containing your `backend` folder

2. **Configure Project:**
   - **Root Directory:** Set to `backend` (if your backend is in a subfolder)
   - **Framework Preset:** Select "Other" or leave default
   - **Build Command:** Leave empty (or `npm install`)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

3. **Set Environment Variables:**
   Click **"Environment Variables"** and add:
   ```
   DB_SERVER = 103.98.12.218
   DB_PORT = 59320
   DB_NAME = CrystalCopier
   DB_USER = Ikonuser
   DB_PASSWORD = userikon
   NODE_ENV = production
   ```
   ⚠️ **Important:** Never commit `.env` file to Git! Use Vercel's environment variables.

4. **Deploy:**
   - Click **"Deploy"**
   - Wait for deployment to complete (2-5 minutes)

---

### Step 4: Get Your Vercel URL

After deployment completes:

1. You'll see a URL like: `https://your-project-name.vercel.app`
2. **Copy this URL** - you'll need it for the mobile app
3. Test the API:
   ```bash
   curl https://your-project-name.vercel.app/
   # Should return: {"success":true,"message":"Backend API is running"}
   ```

---

### Step 5: Update Mobile App Configuration

1. **Update `ServiceApp/src/config/api.js`:**
   - Replace `YOUR_VERCEL_URL` with your actual Vercel URL
   - Example: `https://your-project-name.vercel.app/api`

2. **Update `ServiceApp/app.json`:**
   - Replace `YOUR_VERCEL_URL` in the `apiBaseUrl` field
   - Example: `https://your-project-name.vercel.app/api`

3. **Test the mobile app:**
   ```bash
   cd ServiceApp
   npx expo start --clear
   ```

---

### Step 6: Test Database Connection

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **"Deployments"**
   - Click on the latest deployment
   - Click **"Functions"** tab
   - Check logs for database connection errors

2. **Test API Endpoints:**
   ```bash
   # Health check
   curl https://your-project-name.vercel.app/
   
   # Test an API endpoint (example)
   curl https://your-project-name.vercel.app/api/customers/mobile/1234567890
   ```

3. **Common Issues:**
   - ❌ **"Connection timeout"** → SQL Server firewall blocking Vercel IPs
   - ❌ **"Authentication failed"** → Check DB_USER and DB_PASSWORD
   - ❌ **"Database not found"** → Check DB_NAME

---

## Troubleshooting

### Issue: Database Connection Fails

**Symptoms:**
- API returns 500 errors
- Logs show "ECONNRESET" or "ETIMEDOUT"
- Connection timeout errors

**Solutions:**

1. **Check SQL Server Firewall:**
   - Verify Vercel IP ranges are whitelisted
   - Contact your DBA/admin to add Vercel IPs
   - Vercel IPs change, so you may need to whitelist a range

2. **Check Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify all database credentials are correct
   - Redeploy after changing environment variables

3. **Check Database Server:**
   - Verify SQL Server is running
   - Check if port 59320 is open
   - Test connection from another allowed IP

### Issue: Build Fails

**Symptoms:**
- Deployment shows "Build Failed"
- Error in build logs

**Solutions:**

1. **Check `package.json`:**
   - Ensure all dependencies are listed
   - Run `npm install` locally to verify

2. **Check Node.js Version:**
   - Vercel uses Node.js 18.x by default
   - Add `.nvmrc` file if you need a specific version:
     ```
     18
     ```

3. **Check File Structure:**
   - Ensure `api/index.js` exists
   - Ensure `vercel.json` exists in root

### Issue: API Returns 404

**Symptoms:**
- API endpoints return 404 Not Found
- Health check works but routes don't

**Solutions:**

1. **Check `vercel.json` routes:**
   - Verify routes are configured correctly
   - Ensure `/api/*` routes point to `api/index.js`

2. **Check Route Paths:**
   - Vercel adds `/api` prefix automatically
   - Your routes should be: `/api/customers`, `/api/invoices`, etc.

---

## Environment Variables Reference

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_SERVER` | SQL Server IP/hostname | `103.98.12.218` |
| `DB_PORT` | SQL Server port | `59320` |
| `DB_NAME` | Database name | `CrystalCopier` |
| `DB_USER` | Database username | `Ikonuser` |
| `DB_PASSWORD` | Database password | `userikon` |
| `NODE_ENV` | Environment | `production` |

---

## Updating Deployment

After making code changes:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update backend"
   git push
   ```

2. **Vercel Auto-Deploys:**
   - Vercel automatically detects GitHub pushes
   - Creates a new deployment
   - Updates production URL (if connected to main branch)

3. **Manual Deploy:**
   - Go to Vercel Dashboard
   - Click **"Redeploy"** if needed

---

## Custom Domain (Optional)

1. **Add Domain in Vercel:**
   - Go to Project Settings → Domains
   - Add your domain (e.g., `api.yourdomain.com`)
   - Follow DNS configuration instructions

2. **Update Mobile App:**
   - Update `api.js` and `app.json` with new domain
   - Example: `https://api.yourdomain.com/api`

---

## Monitoring

- **Vercel Dashboard:** View deployments, logs, and analytics
- **Function Logs:** Check real-time logs for errors
- **Analytics:** Monitor API usage and performance

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Check Logs:** Vercel Dashboard → Deployments → Functions → Logs

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Health check endpoint works
- [ ] Database connection tested
- [ ] Mobile app updated with Vercel URL
- [ ] All API endpoints tested
- [ ] SQL Server firewall configured (if needed)

---

**Your backend is now deployed and accessible from anywhere! 🚀**

