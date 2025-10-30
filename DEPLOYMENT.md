# Shopify COA Manager - Deployment Guide

## Quick Deploy to Netlify (Recommended)

### Option 1: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/sdrprod/smokeshowcoa)

### Option 2: Manual Deployment

#### Step 1: Create Netlify Account
1. Go to https://netlify.com
2. Sign up with GitHub (recommended) or email

#### Step 2: Connect Repository
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **GitHub**
3. Select the repository: **sdrprod/smokeshowcoa**
4. Authorize Netlify to access the repository

#### Step 3: Configure Build Settings
Netlify will auto-detect the settings from `netlify.toml`, but verify:

- **Branch to deploy**: `main` (or your preferred branch)
- **Build command**: (leave empty)
- **Publish directory**: `docs`
- **Functions directory**: `netlify/functions`

Click **"Deploy site"**

#### Step 4: Wait for Deployment
- Initial deployment takes 30-60 seconds
- Netlify will provide a temporary URL like: `https://random-name-123456.netlify.app`

#### Step 5: (Optional) Custom Domain
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS

---

## Your App is Live! 🎉

### What You Get

**Live URL**: `https://[your-site-name].netlify.app`

Your users can:
1. Visit the URL
2. Enter their Shopify credentials
3. Manage COAs without any installation

### Features Enabled

✅ **No CORS errors** - Netlify functions proxy Shopify API calls
✅ **HTTPS by default** - Secure connection
✅ **Auto-deploys** - Push to git = auto-update
✅ **Serverless functions** - No backend to maintain
✅ **QR code generation** - Auto-download 512x512 QR codes
✅ **Free hosting** - Netlify free tier is generous

---

## Configuration

### Environment Variables (Optional)

If you want to pre-configure the page ID or URL, add these in Netlify:

1. Go to **Site settings** → **Environment variables**
2. Add variables (these are client-side, so not sensitive):
   - `PAGE_ID`: Shopify page ID (currently: `147838927160`)
   - `PUBLIC_COA_URL`: Public COA page URL

These are currently hardcoded in `docs/app.js` but can be made configurable.

---

## Updating the App

### Automatic Deployment

Netlify auto-deploys when you push to the configured branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Netlify detects the push and redeploys automatically (takes ~30 seconds).

### Manual Deployment

1. Go to **Deploys** in Netlify dashboard
2. Click **"Trigger deploy"** → **"Deploy site"**

---

## Monitoring & Logs

### Function Logs

1. Go to **Functions** tab in Netlify dashboard
2. Click on a function (e.g., `shopify-graphql`)
3. View real-time logs and errors

### Deploy Logs

1. Go to **Deploys** tab
2. Click on any deploy
3. View build and function logs

---

## Troubleshooting

### Functions Not Working

**Symptom**: CORS errors or "Function not found"

**Solution**:
1. Check `netlify.toml` is in repository root
2. Verify `netlify/functions/` directory exists
3. Check function logs in Netlify dashboard
4. Ensure branch being deployed has latest code

### API Calls Failing

**Symptom**: "Connection failed" errors

**Solution**:
1. Check Shopify credentials are correct
2. Verify custom app has required permissions:
   - `read_files`, `write_files`
   - `read_content`, `write_content`
3. Check function logs for detailed error messages

### QR Code Not Generating

**Symptom**: File uploads but no QR code

**Solution**:
1. Check browser console for errors
2. Verify `qrcode.js` library loaded (check Network tab)
3. Try different browser (Chrome/Edge recommended)

---

## Architecture

```
┌─────────────┐
│   Browser   │
│  (User)     │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────────────────┐
│   Netlify CDN               │
│   - Serves docs/index.html  │
│   - Serves docs/app.js      │
└──────┬──────────────────────┘
       │
       │ API Calls
       ▼
┌─────────────────────────────┐
│   Netlify Functions         │
│   - /api/graphql            │
│   - /api/rest               │
│   - /api/upload             │
└──────┬──────────────────────┘
       │
       │ Authenticated
       ▼
┌─────────────────────────────┐
│   Shopify Admin API         │
│   - GraphQL (files)         │
│   - REST (pages)            │
└─────────────────────────────┘
```

### Security Notes

- ✅ Shopify token never stored on server
- ✅ Token passed from browser to function per request
- ✅ Functions validate all inputs
- ✅ HTTPS everywhere
- ✅ No third-party analytics or tracking

---

## Cost

**Netlify Free Tier** includes:
- 100 GB bandwidth/month
- 300 build minutes/month
- 125,000 function requests/month
- Automatic HTTPS

This is MORE than enough for a tool with 1-10 users managing COAs.

---

## Alternative: Deploy to Vercel

If you prefer Vercel over Netlify:

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"New Project"**
4. Import `sdrprod/smokeshowcoa`
5. Set **Root Directory**: `docs`
6. Vercel auto-detects Netlify functions and converts them

Works the same way, similar free tier.

---

## Support

### Netlify Documentation
- Functions: https://docs.netlify.com/functions/overview/
- Deploys: https://docs.netlify.com/site-deploys/overview/

### Shopify API Documentation
- Admin API: https://shopify.dev/docs/api/admin
- Custom Apps: https://shopify.dev/docs/apps/build/authentication-authorization

---

## Next Steps

1. ✅ Deploy to Netlify
2. ✅ Test the live URL
3. ✅ Share URL with your client
4. ✅ Bookmark the URL for easy access
5. ✅ (Optional) Set up custom domain

**That's it! Your COA Manager is live and ready to use.** 🚀
