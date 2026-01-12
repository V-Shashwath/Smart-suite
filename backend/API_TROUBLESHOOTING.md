# API Endpoints Not Working - Troubleshooting Guide

## Quick Fixes

### Issue: API endpoints return 404 or no response

**Common Causes:**
1. Vercel routing configuration issue
2. Express routes not properly configured
3. Serverless function export format incorrect

## Step 1: Verify Vercel Deployment

1. **Check Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Check latest deployment status
   - View function logs for errors

2. **Test Health Endpoint:**
   ```bash
   curl https://smart-suite-eight.vercel.app/
   ```
   Should return: `{"success":true,"message":"Backend API is running"}`

## Step 2: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click on latest deployment
3. Go to "Functions" tab
4. Click on the function
5. Check "Logs" for errors

**Common errors to look for:**
- Database connection errors
- Module not found errors
- Route not found errors

## Step 3: Verify Route Configuration

Your routes should be:
- `https://smart-suite-eight.vercel.app/` - Health check
- `https://smart-suite-eight.vercel.app/api/customers/...`
- `https://smart-suite-eight.vercel.app/api/invoices/...`
- `https://smart-suite-eight.vercel.app/api/executives/...`
- `https://smart-suite-eight.vercel.app/api/products/...`

## Step 4: Test Individual Endpoints

```bash
# Health check
curl https://smart-suite-eight.vercel.app/

# Test customers endpoint
curl https://smart-suite-eight.vercel.app/api/customers/mobile/1234567890

# Test executives endpoint
curl https://smart-suite-eight.vercel.app/api/executives/screens/all
```

## Step 5: Check Database Connection

If endpoints return 500 errors, check:

1. **Vercel Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify all are set:
     - `DB_SERVER=103.98.12.218`
     - `DB_PORT=59320`
     - `DB_NAME=CrystalCopier`
     - `DB_USER=Ikonuser`
     - `DB_PASSWORD=userikon`

2. **SQL Server Firewall:**
   - Vercel IPs must be whitelisted
   - Check Vercel function logs for connection errors

## Step 6: Redeploy After Changes

After fixing configuration:

1. **Commit changes:**
   ```bash
   cd backend
   git add .
   git commit -m "Fix API routing"
   git push
   ```

2. **Vercel will auto-deploy** or manually redeploy from dashboard

## Common Issues & Solutions

### Issue: All endpoints return 404

**Solution:**
- Check `vercel.json` routes configuration
- Ensure `api/index.js` exists and exports the app correctly
- Verify Express routes are set up with `/api/` prefix

### Issue: Endpoints return 500 errors

**Solution:**
- Check Vercel function logs
- Verify database connection (most common issue)
- Check environment variables are set correctly
- Verify SQL Server firewall allows Vercel IPs

### Issue: CORS errors

**Solution:**
- CORS is already configured in `server.js`
- If still having issues, check mobile app API URL

### Issue: Timeout errors (Connection timeout to database)

**Symptoms:**
- Error: "Failed to connect to 103.98.12.218:59320 in 15000ms" or "Connection timeout"
- API returns 500 errors with timeout messages
- Authentication endpoints fail with connection errors

**Root Cause:**
The SQL Server firewall is blocking Vercel's IP addresses. Vercel uses dynamic IP addresses that change, so you need to whitelist Vercel's IP ranges.

**Solutions:**

1. **Whitelist Vercel IP Ranges in SQL Server Firewall:**
   - Vercel uses dynamic IPs, so you need to whitelist their IP ranges
   - Contact your DBA/Network admin to add Vercel IP ranges to SQL Server firewall
   - Vercel IP ranges can be found at: https://vercel.com/docs/security/deployment-protection#ip-addresses
   - Common Vercel IP ranges (check Vercel docs for latest):
     - `76.76.21.0/24`
     - `76.223.126.0/24`
     - And other ranges listed in Vercel documentation
   
2. **Alternative: Use a VPN or Proxy:**
   - Set up a VPN or proxy server with a static IP
   - Whitelist that IP in SQL Server firewall
   - Route database connections through the VPN/proxy

3. **Check Database Server Status:**
   - Verify SQL Server is running and accessible
   - Check if port 59320 is open and not blocked
   - Test connection from another allowed IP to confirm database is accessible

4. **Verify Environment Variables:**
   - Ensure `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` are set correctly in Vercel
   - Redeploy after changing environment variables

**Note:** The connection timeout has been optimized to 30 seconds with retry logic. If you continue to see timeouts, it's almost certainly a firewall issue.

## Debugging Steps

1. **Check Vercel Logs:**
   - Dashboard → Deployments → Functions → Logs
   - Look for error messages

2. **Test Locally First:**
   ```bash
   cd backend
   npm start
   # Test: curl http://localhost:3000/api/customers/mobile/1234567890
   ```

3. **Verify File Structure:**
   ```
   backend/
   ├── api/
   │   └── index.js
   ├── src/
   │   ├── server.js
   │   ├── routes/
   │   └── ...
   ├── vercel.json
   └── package.json
   ```

4. **Check Express Routes:**
   - Routes should be: `/api/customers`, `/api/invoices`, etc.
   - Not: `/customers`, `/invoices` (missing `/api` prefix)

## Still Not Working?

1. **Check Vercel Status:** https://vercel-status.com
2. **Review Vercel Docs:** https://vercel.com/docs
3. **Check Function Logs:** Most errors will show in logs
4. **Test with Postman/Insomnia:** Use API testing tool

## Quick Test Commands

```bash
# Health check
curl https://smart-suite-eight.vercel.app/

# Test API endpoint
curl https://smart-suite-eight.vercel.app/api/customers/mobile/1234567890

# Check response headers
curl -I https://smart-suite-eight.vercel.app/api/customers/mobile/1234567890
```

