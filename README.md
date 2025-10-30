# Shopify COA Manager

A standalone web application for managing Certificates of Analysis (COA) PDFs in Shopify, with automatic page updates and QR code generation.

## 🚀 Live Demo

**Deploy this to Netlify in 2 minutes** → See [DEPLOYMENT.md](DEPLOYMENT.md)

## ✨ Features

### Core Functionality
- ✅ **Add new COA PDFs** to Shopify Files
- ✅ **Modify existing COAs** - update title, date, description, or replace PDF
- ✅ **Delete COAs** - remove from Shopify and page list
- ✅ **Auto-update page** - maintains alphabetically sorted list
- ✅ **QR code generation** - auto-downloads 512x512 QR codes for each PDF

### Technical Features
- ✅ **No backend required** - serverless functions handle API calls
- ✅ **No CORS issues** - Netlify proxy solves browser limitations
- ✅ **Secure** - credentials stored locally in browser only
- ✅ **Free hosting** - runs on Netlify/Vercel free tier
- ✅ **Auto-deploy** - push to git = instant updates

## 📋 Requirements

### Shopify Setup
1. Create a **Legacy Custom App** in Shopify Admin
2. Enable API scopes:
   - `read_files`
   - `write_files`
   - `read_content`
   - `write_content`
3. Install the app and copy the **Admin API access token**

### Page Setup
Add these HTML markers to your COA page:

```html
<!-- COA-LIST-START -->
<ul id="coa-list"></ul>
<!-- COA-LIST-END -->
```

See [shopify-coa-tool/README.txt](shopify-coa-tool/README.txt) for detailed Shopify setup instructions.

## 🎯 Quick Start

### Option 1: Deploy to Netlify (Recommended)

1. **Fork this repository** (or use existing)
2. **Sign up at Netlify.com** (free account)
3. **Import project** from GitHub
4. **Deploy** - takes 60 seconds
5. **Visit your URL** and start managing COAs

Detailed steps in [DEPLOYMENT.md](DEPLOYMENT.md)

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/sdrprod/smokeshowcoa.git
cd smokeshowcoa

# Install Netlify CLI
npm install -g netlify-cli

# Run locally with serverless functions
netlify dev

# Open http://localhost:8888
```

## 📁 Project Structure

```
smokeshowcoa/
├── docs/                      # Main application (deployed)
│   ├── index.html            # UI with TailwindCSS
│   └── app.js                # Application logic (v2.0)
├── netlify/
│   └── functions/            # Serverless API proxies
│       ├── shopify-graphql.js   # GraphQL proxy
│       ├── shopify-rest.js      # REST API proxy
│       └── upload-file.js       # File upload handler
├── shopify-coa-tool/         # Downloadable standalone version
│   ├── index.html            # Original version (v1.0)
│   ├── app.js                # Original logic
│   └── README.txt            # User documentation
├── netlify.toml              # Netlify configuration
├── DEPLOYMENT.md             # Deployment guide
└── README.md                 # This file
```

## 🔧 Configuration

Edit `docs/app.js` to change:

```javascript
const CONFIG = {
    PAGE_ID: '147838927160',  // Your Shopify page ID
    PUBLIC_COA_URL: 'https://smokeshowlabs.com/pages/...',
    QR_SIZE: 512,  // QR code dimensions
    MAX_DESCRIPTION_LENGTH: 220
};
```

## 🎨 How It Works

### User Flow
1. User visits the hosted URL
2. Enters Shopify domain and access token
3. Chooses action: Add, Modify, or Delete
4. Fills form and submits
5. App updates Shopify Files and page
6. QR code auto-downloads (for new uploads)

### Technical Flow
```
Browser → Netlify Functions → Shopify Admin API
                ↓
         QR Code Generated
                ↓
         Auto-downloaded PNG
```

### QR Code Feature
- **When**: Generated for new uploads and file replacements
- **Format**: 512x512 PNG
- **Filename**: `[ProductName]_QR.png`
- **Links to**: Direct PDF URL on Shopify CDN
- **Use case**: Print QR codes for product packaging, print materials

## 📄 Files Included

### For Deployment
- `docs/` - The web application
- `netlify/` - Serverless functions
- `netlify.toml` - Configuration

### For Distribution
- `shopify-coa-tool.zip` - Downloadable standalone version
  - Includes legacy files (requires local server)
  - Use Netlify deployment instead

## 🔐 Security

- ✅ **No server-side storage** - credentials stored in browser localStorage only
- ✅ **Tokens in transit only** - passed to functions per request, not stored
- ✅ **HTTPS everywhere** - Netlify provides automatic SSL
- ✅ **HTML sanitization** - prevents XSS attacks
- ✅ **No third-party tracking** - no analytics, no external calls

## 🆘 Troubleshooting

### "Connection failed" error
- Verify Shopify domain format: `your-store.myshopify.com`
- Check access token is correct (starts with `shpat_`)
- Ensure custom app has all 4 required permissions

### "Comment markers not found"
- Add HTML markers to your Shopify page:
  ```html
  <!-- COA-LIST-START -->
  <ul id="coa-list"></ul>
  <!-- COA-LIST-END -->
  ```

### QR code not downloading
- Check browser console for errors
- Try Chrome or Edge (better support)
- Disable popup blockers temporarily

### Functions not working (Netlify)
- Check Netlify function logs
- Verify `netlify.toml` exists in repo root
- Ensure latest code is deployed

## 📚 Documentation

- **User Guide**: [shopify-coa-tool/README.txt](shopify-coa-tool/README.txt)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Shopify Setup**: See README.txt for step-by-step instructions

## 🔄 Updates

The app auto-deploys when you push to the main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Netlify detects the change and redeploys in ~30 seconds.

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Firefox 88+

## 📊 API Usage

Typical usage per COA action:
- **Add**: ~5 API calls (staged upload, file create, page get, page update)
- **Modify**: ~4-6 API calls (depending on file replacement)
- **Delete**: ~3 API calls (file delete, page get, page update)

Well within Netlify's 125k requests/month free tier.

## 🤝 Contributing

This is a private tool for specific use case, but improvements welcome:

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test locally with `netlify dev`
5. Submit pull request

## 📞 Support

For Shopify API questions:
- https://shopify.dev/docs/api/admin

For Netlify questions:
- https://docs.netlify.com/

For this app:
- Open an issue on GitHub
- Check function logs in Netlify dashboard

## 📜 License

Private project for Smoke Show Labs.

## 🎉 Credits

Built with:
- **TailwindCSS** - UI styling
- **QRCode.js** - QR code generation
- **Netlify** - Hosting and serverless functions
- **Shopify Admin API** - Data management

---

**Ready to deploy?** → See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

**Need help with Shopify setup?** → See [shopify-coa-tool/README.txt](shopify-coa-tool/README.txt)
