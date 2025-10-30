================================================================================
SHOPIFY COA TOOL - UPDATE SSL CERTIFICATES OF ANALYSIS
Version 1.0
================================================================================

OVERVIEW
--------
This tool allows you to manage Certificate of Analysis (COA) PDF files in
Shopify and automatically update the COA listing page on your website.

QUICK START
-----------
1. Unzip this folder anywhere on your computer
2. Double-click "index.html" to open in your browser
3. Enter your Shopify store domain and access token
4. Choose Add, Modify, or Delete action
5. Follow the on-screen prompts
6. Click "Open the COA Page" to verify your updates

REQUIREMENTS
------------
- Modern web browser (Chrome, Edge, Safari, Firefox - latest version)
- Shopify Custom App with the following permissions:
  * read_files
  * write_files
  * read_content
  * write_content

SHOPIFY SETUP INSTRUCTIONS
---------------------------

STEP 1: CREATE A CUSTOM APP
1. Log in to your Shopify Admin
2. Go to Settings > Apps and sales channels
3. Click "Develop apps" button
4. Click "Create an app"
5. Name it "COA Manager" (or your preferred name)
6. Click "Create app"

STEP 2: CONFIGURE API SCOPES
1. Click "Configure Admin API scopes"
2. Scroll down and check these boxes:
   [✓] read_files
   [✓] write_files
   [✓] read_content
   [✓] write_content
3. Click "Save" at the bottom

STEP 3: INSTALL THE APP
1. Click "Install app" button
2. Confirm installation

STEP 4: GET YOUR ACCESS TOKEN
1. After installation, click "Reveal token once" under "Admin API access token"
2. COPY THIS TOKEN IMMEDIATELY - it will only be shown once!
3. Save it in a secure password manager or secure location
4. This is the "Access Token" you'll enter in the COA Tool

STEP 5: GET YOUR STORE DOMAIN
Your store domain is in the format: your-store-name.myshopify.com
You can find this in your browser's address bar when logged into Shopify Admin.

Example: If your admin URL is https://admin.shopify.com/store/your-store-name
Then your domain is: your-store-name.myshopify.com

STEP 6: PREPARE YOUR COA PAGE
1. Log in to Shopify Admin
2. Go to Online Store > Pages
3. Open your COA page (Certificates of Analysis page)
4. Switch to HTML mode (< > icon in editor)
5. Add these HTML comment markers where you want the COA list:

   <!-- COA-LIST-START -->
   <ul id="coa-list"></ul>
   <!-- COA-LIST-END -->

6. Click "Save"

IMPORTANT: The markers must be EXACTLY as shown above. The tool will only
update content between these markers.

USING THE TOOL
--------------

ADDING A NEW COA:
1. Select "Add a New COA" from the dropdown
2. Enter the Title (required) - e.g., "Black Amber"
3. Optionally enter Test Date (YYYY-MM-DD format)
4. Optionally enter Description (max 220 characters)
5. Select the PDF file to upload
6. Click "Submit"

MODIFYING AN EXISTING COA:
1. Select "Modify an Existing COA" from the dropdown
2. Choose the file from the dropdown list
3. Update Title, Date, or Description as needed
4. Optionally upload a replacement PDF file
5. Click "Submit"

DELETING A COA:
1. Select "Delete an Existing COA" from the dropdown
2. Choose the file from the dropdown list
3. Check the confirmation box
4. Click "Delete COA"

VALIDATION RULES
----------------
- Title: Required for all operations
- Date: Must be in YYYY-MM-DD format (e.g., 2025-08-04)
- Description: Maximum 220 characters
- File: Must be a PDF (.pdf)
- Duplicate titles are not allowed

FILE FORMAT
-----------
All files must be PDF format (application/pdf or .pdf extension).

LIST ITEM FORMAT
----------------
The tool generates list items in this format:

Without description:
  <li><a href="file.pdf" target="_blank">Black Amber</a> (test date: 2025-08-04)</li>

With description:
  <li><a href="file.pdf" target="_blank">Black Amber</a> (test date: 2025-08-04) – High-potency batch.</li>

All items are sorted alphabetically by title.
All links open in a new browser tab.

SECURITY & PRIVACY
------------------
- Your access token is stored ONLY in your browser's local storage
- No data is sent to any third-party servers
- All API calls go directly to Shopify's official API
- The tool runs entirely on your local computer

TROUBLESHOOTING
---------------

"Invalid domain or token"
→ Double-check your domain format (must include .myshopify.com)
→ Verify your access token was copied correctly
→ Ensure your custom app has the required API scopes

"Comment markers not found in page"
→ Make sure you added the HTML comments to your COA page:
  <!-- COA-LIST-START -->
  <ul id="coa-list"></ul>
  <!-- COA-LIST-END -->

"Connection failed"
→ Check your internet connection
→ Verify your access token hasn't been revoked
→ Make sure the custom app is still installed

"File must be a PDF"
→ Only PDF files are accepted
→ Ensure file extension is .pdf

"A COA with this title already exists"
→ Choose a different title
→ Or modify the existing COA instead of adding a new one

API RATE LIMITS
---------------
The tool automatically handles Shopify's API rate limits with exponential
backoff retry logic. If you see temporary delays, this is normal.

OBTAINING API KEYS & CREDENTIALS
---------------------------------

WHAT YOU NEED:
1. Shopify Domain (format: your-store.myshopify.com)
2. Admin API Access Token (from Custom App)

HOW TO GET THEM:
See "SHOPIFY SETUP INSTRUCTIONS" section above for detailed steps.

IMPORTANT SECURITY NOTES:
- Never share your access token with anyone
- Never commit the token to version control (Git, etc.)
- Store it securely in a password manager
- If compromised, uninstall the app and create a new one

WEBHOOKS & MCPs
---------------
This tool does NOT require any webhooks or MCP (Message Control Protocol)
configurations. It communicates directly with Shopify's Admin API using:
- GraphQL API for file operations
- REST API for page content updates

NO ADDITIONAL CONFIGURATION NEEDED beyond creating the custom app and
obtaining the access token.

CONFIGURATION FILES
-------------------
There are NO configuration files to edit. All settings are entered through
the web interface:
1. Shopify Domain
2. Access Token

These are saved in your browser's localStorage for convenience.

PAGE ID CONFIGURATION:
The tool is pre-configured to update page ID: 147838927160
If you need to update a different page, you'll need to edit app.js and
change the PAGE_ID in the CONFIG object at the top of the file.

PUBLIC COA URL:
Pre-configured: https://smokeshowlabs.com/pages/certificates-of-analysis-independent-lab-results
To change this, edit the PUBLIC_COA_URL in the CONFIG object in app.js.

TECHNICAL DETAILS
-----------------
- Uses Shopify Admin API version 2024-10
- GraphQL endpoint for file operations
- REST endpoint for page content updates
- TailwindCSS 3.x for styling (loaded via CDN)
- No build tools or dependencies required
- Works entirely in the browser (client-side only)

FILES INCLUDED
--------------
index.html    - Main application interface
app.js        - Application logic and Shopify API integration
README.txt    - This file (user documentation)

SUPPORT
-------
For Shopify API documentation, visit:
https://shopify.dev/docs/api/admin

For issues with this tool, contact your developer or refer to the
source code comments in app.js for implementation details.

VERSION HISTORY
---------------
v1.0 (2025) - Initial release
- Add, modify, delete COA PDFs
- Automatic page list updates
- Alphabetical sorting
- Client-side only, no server required

================================================================================
END OF DOCUMENTATION
================================================================================
