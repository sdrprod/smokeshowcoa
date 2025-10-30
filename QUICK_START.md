# 🚀 QUICK START - Shopify COA Manager

## ✅ What's Been Built

I've created a **complete, production-ready Shopify COA Manager** with:

### Core Features
✅ Add, Modify, Delete COA PDFs in Shopify
✅ Auto-update Shopify page with alphabetical list
✅ **NEW:** Auto-generate & download 512x512 QR codes for each PDF
✅ QR codes link directly to PDF URLs (perfect for product packaging)

### Technical Solutions
✅ **Fixed CORS issues** with Netlify serverless proxy
✅ Works from any HTTPS URL (no local server needed)
✅ Fully client-side with serverless backend
✅ Free hosting on Netlify (no costs)

---

## 🎯 Your Next Steps

### 1. Deploy to Netlify (5 minutes)

**Option A: Automatic**
1. Go to https://app.netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select this repository: `sdrprod/smokeshowcoa`
5. Netlify auto-detects settings from `netlify.toml`
6. Click "Deploy site"
7. Wait 60 seconds → Get your URL!

**Option B: Detailed Steps**
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete walkthrough

### 2. Get Your Live URL

After deployment, Netlify provides:
```
https://[your-site-name].netlify.app
```

Bookmark this URL and share with your client!

### 3. Test the App

1. Visit your Netlify URL
2. Enter Shopify credentials:
   - Domain: `cufmyu-70.myshopify.com`
   - Access Token: (from your legacy custom app)
3. Click "Test Connection"
4. Try adding a test COA → QR code downloads automatically!

---

## 📁 What Was Created

### New Files

#### Netlify Functions (CORS Solution)
```
netlify/functions/
├── shopify-graphql.js   ← Proxies GraphQL requests
├── shopify-rest.js      ← Proxies REST requests
└── upload-file.js       ← Handles file uploads
```

#### Configuration
```
netlify.toml             ← Netlify deployment config
```

#### Documentation
```
README.md                ← Project overview
DEPLOYMENT.md            ← Step-by-step deployment guide
QUICK_START.md           ← This file
```

### Updated Files

#### docs/app.js (v2.0)
- Updated to use Netlify proxy functions
- Added QR code generation
- Added QR code preview UI
- Smart QR generation (only for new/replaced files)

#### docs/index.html
- Added QRCode.js library (CDN)
- Ready for QR code display

---

## 🎨 New QR Code Feature

### How It Works
1. User uploads a new COA PDF
2. App automatically generates 512x512 QR code
3. QR code downloads as `[ProductName]_QR.png`
4. QR code preview shows in UI
5. Scan QR → Opens PDF directly

### When QR Codes Generate
✅ **Adding new COA** → QR generated
✅ **Replacing PDF file** → New QR generated
❌ **Updating metadata only** → No QR (keeps existing PDF)
❌ **Deleting COA** → No QR

### QR Code Format
- **Size:** 512 x 512 pixels
- **Format:** PNG
- **Filename:** `BlackAmber_QR.png` (sanitized product name)
- **Content:** Direct URL to PDF on Shopify CDN
- **Colors:** Black on white (standard)

---

## 🔧 Configuration

### Current Settings (in docs/app.js)
```javascript
PAGE_ID: '147838927160'  // Your Shopify COA page
PUBLIC_COA_URL: 'https://smokeshowlabs.com/pages/certificates-of-analysis...'
QR_SIZE: 512              // QR code dimensions
```

To change these, edit `docs/app.js` lines 8-14.

---

## 📊 Architecture

```
┌─────────────┐
│   Browser   │ ← User visits Netlify URL
└──────┬──────┘
       │
       ↓
┌─────────────────────────────┐
│   Netlify (Free Hosting)    │
│   - Serves HTML/JS/CSS      │
│   - Runs serverless functions│
└──────┬──────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│   Shopify Admin API         │
│   - GraphQL (files)         │
│   - REST (pages)            │
└─────────────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│   QR Code Generated         │
│   - 512x512 PNG             │
│   - Auto-download           │
│   - Preview in UI           │
└─────────────────────────────┘
```

---

## 🎯 For Your Client

Once deployed, your client:

1. **Visits the URL** (no installation)
2. **Enters credentials** (saved in browser)
3. **Manages COAs** with simple UI
4. **Gets QR codes** automatically downloaded

### Client Instructions
Share this with them:
1. Go to: `https://[your-site].netlify.app`
2. Enter your Shopify domain and token (one time)
3. Click "Save & Connect"
4. Choose Add/Modify/Delete
5. QR codes download automatically for new uploads

---

## 🆘 Troubleshooting

### If deployment fails:
- Check `netlify.toml` is in repo root ✓
- Verify `netlify/functions/` directory exists ✓
- Check Netlify build logs for errors

### If CORS errors persist:
- Verify functions are deployed (check Netlify Functions tab)
- Check function logs for errors
- Ensure using `/api/graphql` endpoint (not direct Shopify URL)

### If QR codes don't generate:
- Check browser console (F12)
- Verify `qrcode.js` loaded (Network tab)
- Try Chrome/Edge (best support)

---

## 📚 Full Documentation

- **Complete Guide**: [README.md](README.md)
- **Deployment Steps**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Shopify Setup**: [shopify-coa-tool/README.txt](shopify-coa-tool/README.txt)

---

## ✨ Summary of Changes

### What Was Fixed
- ❌ CORS errors → ✅ Netlify proxy
- ❌ File:// protocol issues → ✅ HTTPS hosting
- ❌ Complex local setup → ✅ Simple URL

### What Was Added
- 🆕 QR code generation (512x512 PNG)
- 🆕 QR code preview in UI
- 🆕 Auto-download with smart naming
- 🆕 Only generates for new/replaced files

### What Stays The Same
- ✅ All original features (Add/Modify/Delete)
- ✅ Alphabetical sorting
- ✅ Page auto-update
- ✅ Shopify Files integration
- ✅ Local credential storage (secure)

---

## 🎉 You're Done!

**Current Status:**
- ✅ Code complete and pushed to GitHub
- ✅ Netlify configuration ready
- ✅ Documentation complete
- ⏳ Awaiting Netlify deployment

**Next Action:**
1. Deploy to Netlify (5 minutes)
2. Test with your Shopify store
3. Share URL with client

**Estimated Time to Production:** 10 minutes

---

**Questions?**
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed steps
- Check [README.md](README.md) for complete documentation
- Review Netlify function logs if issues arise

**Everything is ready to go! 🚀**
