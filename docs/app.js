// Shopify COA Manager - Main Application Logic
// Version 2.0 - With Netlify Proxy & QR Code Generation

// ============================================================================
// CONFIGURATION & STATE
// ============================================================================

const CONFIG = {
    PAGE_ID: '147838927160', // Shopify page ID to update
    PUBLIC_COA_URL: 'https://smokeshowlabs.com/pages/certificates-of-analysis-independent-lab-results',
    MAX_RETRIES: 3,
    RETRY_DELAYS: [1000, 2000, 4000], // Exponential backoff
    MAX_DESCRIPTION_LENGTH: 220,
    QR_SIZE: 512, // QR code size in pixels
    // API endpoints - will use Netlify functions
    API_GRAPHQL: '/api/graphql',
    API_REST: '/api/rest',
    API_UPLOAD: '/api/upload'
};

let state = {
    domain: '',
    token: '',
    isConnected: false,
    existingFiles: [],
    lastQRCode: null // Store last generated QR code
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachEventListeners();
});

function initializeApp() {
    // Load saved credentials
    const savedDomain = localStorage.getItem('shopifyDomain');
    const savedToken = localStorage.getItem('shopifyToken');

    if (savedDomain && savedToken) {
        document.getElementById('shopifyDomain').value = savedDomain;
        document.getElementById('accessToken').value = savedToken;
        state.domain = savedDomain;
        state.token = savedToken;
        document.getElementById('testConnection').disabled = false;
        showStatus('info', 'Credentials loaded. Click "Test Connection" to verify.');
    }
}

function attachEventListeners() {
    // Credentials
    document.getElementById('saveCredentials').addEventListener('click', saveCredentials);
    document.getElementById('testConnection').addEventListener('click', testConnection);
    document.getElementById('credentialsHeader').addEventListener('click', toggleCredentialsSection);

    // Action selection
    document.getElementById('actionSelect').addEventListener('change', handleActionChange);

    // Form fields
    document.getElementById('coaDescription').addEventListener('input', updateCharCount);
    document.getElementById('deleteConfirm').addEventListener('change', handleDeleteConfirmChange);
    document.getElementById('existingFileSelect').addEventListener('change', handleExistingFileSelect);

    // Submit buttons
    document.getElementById('submitAction').addEventListener('click', handleSubmitAction);
    document.getElementById('submitDelete').addEventListener('click', handleSubmitDelete);
}

function toggleCredentialsSection() {
    const content = document.getElementById('credentialsContent');
    const toggle = document.getElementById('credentialsToggle');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
    }
}

function collapseCredentialsSection() {
    const content = document.getElementById('credentialsContent');
    const toggle = document.getElementById('credentialsToggle');
    content.style.display = 'none';
    toggle.textContent = '▶';
}

// ============================================================================
// CREDENTIAL MANAGEMENT
// ============================================================================

function saveCredentials() {
    const domain = document.getElementById('shopifyDomain').value.trim();
    const token = document.getElementById('accessToken').value.trim();

    if (!domain || !token) {
        showStatus('error', 'Please enter both domain and access token.');
        return;
    }

    // Validate domain format
    if (!domain.includes('.myshopify.com') && !domain.includes('.')) {
        showStatus('error', 'Invalid domain format. Use: your-store.myshopify.com');
        return;
    }

    // Save to localStorage
    localStorage.setItem('shopifyDomain', domain);
    localStorage.setItem('shopifyToken', token);

    state.domain = domain;
    state.token = token;

    document.getElementById('testConnection').disabled = false;
    showStatus('success', 'Credentials saved! Click "Test Connection" to verify.');
}

async function testConnection() {
    showStatus('info', 'Testing connection...');

    try {
        // Test GraphQL API with a simple query
        const result = await makeGraphQLRequest(`
            {
                shop {
                    name
                    id
                }
            }
        `);

        if (result.data && result.data.shop) {
            state.isConnected = true;
            showStatus('success', `Connected to ${result.data.shop.name}!`);
            document.getElementById('mainSection').style.display = 'block';
            document.getElementById('linkSection').style.display = 'block';
            // Collapse credentials section after successful connection
            collapseCredentialsSection();
        } else {
            throw new Error('Invalid response from Shopify API');
        }
    } catch (error) {
        showStatus('error', `Connection failed: ${error.message}`);
        state.isConnected = false;
    }
}

// ============================================================================
// UI HANDLERS
// ============================================================================

function handleActionChange(e) {
    const action = e.target.value;
    const addModifyForm = document.getElementById('addModifyForm');
    const deleteForm = document.getElementById('deleteForm');
    const fileSelectSection = document.getElementById('fileSelectSection');
    const fileUploadLabel = document.getElementById('fileUploadLabel');
    const fileRequired = document.getElementById('fileRequired');
    const qrPreview = document.getElementById('qrPreview');

    // Hide all forms
    addModifyForm.style.display = 'none';
    deleteForm.style.display = 'none';
    if (qrPreview) qrPreview.style.display = 'none';

    if (action === 'add') {
        addModifyForm.style.display = 'block';
        fileSelectSection.style.display = 'none';
        fileUploadLabel.textContent = 'PDF File';
        fileRequired.style.display = 'inline';
        document.getElementById('coaFile').required = true;
        clearForm();
    } else if (action === 'modify') {
        addModifyForm.style.display = 'block';
        fileSelectSection.style.display = 'block';
        fileUploadLabel.textContent = 'Replace PDF File (optional)';
        fileRequired.style.display = 'none';
        document.getElementById('coaFile').required = false;
        clearForm();
        loadExistingFiles('existingFileSelect');
    } else if (action === 'delete') {
        deleteForm.style.display = 'block';
        loadExistingFiles('deleteFileSelect');
    }
}

function handleExistingFileSelect(e) {
    const fileId = e.target.value;
    if (!fileId) return;

    const file = state.existingFiles.find(f => f.id === fileId);
    if (file) {
        document.getElementById('coaTitle').value = file.title;
        document.getElementById('testDate').value = file.testDate || '';
        document.getElementById('coaDescription').value = file.description || '';
        updateCharCount();
    }
}

function handleDeleteConfirmChange(e) {
    document.getElementById('submitDelete').disabled = !e.target.checked;
}

function updateCharCount() {
    const textarea = document.getElementById('coaDescription');
    const count = document.getElementById('charCount');
    count.textContent = textarea.value.length;
}

function clearForm() {
    document.getElementById('coaTitle').value = '';
    document.getElementById('testDate').value = '';
    document.getElementById('coaDescription').value = '';
    document.getElementById('coaFile').value = '';
    document.getElementById('deleteConfirm').checked = false;
    updateCharCount();

    // Hide QR preview
    const qrPreview = document.getElementById('qrPreview');
    if (qrPreview) qrPreview.style.display = 'none';
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleSubmitAction() {
    const action = document.getElementById('actionSelect').value;

    if (action === 'add') {
        await handleAddCOA();
    } else if (action === 'modify') {
        await handleModifyCOA();
    }
}

async function handleAddCOA() {
    const title = document.getElementById('coaTitle').value.trim();
    const testDate = document.getElementById('testDate').value;
    const description = document.getElementById('coaDescription').value.trim();
    const fileInput = document.getElementById('coaFile');

    // Validation
    if (!title) {
        showStatus('error', 'Title is required.');
        return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
        showStatus('error', 'Please select a PDF file to upload.');
        return;
    }

    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        showStatus('error', 'File must be a PDF.');
        return;
    }

    if (testDate && !isValidDate(testDate)) {
        showStatus('error', 'Invalid date format. Use YYYY-MM-DD.');
        return;
    }

    if (description.length > CONFIG.MAX_DESCRIPTION_LENGTH) {
        showStatus('error', `Description must be ${CONFIG.MAX_DESCRIPTION_LENGTH} characters or less.`);
        return;
    }

    // Check for duplicate title
    if (state.existingFiles.some(f => f.title.toLowerCase() === title.toLowerCase())) {
        showStatus('error', 'A COA with this title already exists. Please use a different title.');
        return;
    }

    showStatus('info', 'Uploading file to Shopify...');

    try {
        // Upload file
        const uploadedFile = await uploadFile(file, title);

        showStatus('info', 'File uploaded. Updating COA page...');

        // Update page
        await updateCOAPage('add', {
            id: uploadedFile.id,
            title: title,
            url: uploadedFile.url,
            testDate: testDate,
            description: description
        });

        showStatus('info', 'Generating QR code...');

        // Generate and download QR code
        await generateQRCode(uploadedFile.url, title);

        showStatus('success', `Uploaded '${title}' and updated COA list. QR code downloaded!`);
        clearForm();
        document.getElementById('actionSelect').value = '';
        handleActionChange({ target: { value: '' } });

    } catch (error) {
        showStatus('error', `Failed to add COA: ${error.message}`);
    }
}

async function handleModifyCOA() {
    const fileId = document.getElementById('existingFileSelect').value;
    const title = document.getElementById('coaTitle').value.trim();
    const testDate = document.getElementById('testDate').value;
    const description = document.getElementById('coaDescription').value.trim();
    const fileInput = document.getElementById('coaFile');

    // Validation
    if (!fileId) {
        showStatus('error', 'Please select a COA to modify.');
        return;
    }

    if (!title) {
        showStatus('error', 'Title is required.');
        return;
    }

    const existingFile = state.existingFiles.find(f => f.id === fileId);
    if (!existingFile) {
        showStatus('error', 'Selected file not found.');
        return;
    }

    // Check for duplicate title (excluding current file)
    if (state.existingFiles.some(f => f.id !== fileId && f.title.toLowerCase() === title.toLowerCase())) {
        showStatus('error', 'A COA with this title already exists. Please use a different title.');
        return;
    }

    if (testDate && !isValidDate(testDate)) {
        showStatus('error', 'Invalid date format. Use YYYY-MM-DD.');
        return;
    }

    if (description.length > CONFIG.MAX_DESCRIPTION_LENGTH) {
        showStatus('error', `Description must be ${CONFIG.MAX_DESCRIPTION_LENGTH} characters or less.`);
        return;
    }

    try {
        let newUrl = existingFile.url;
        let fileWasReplaced = false;

        // If new file is provided, upload it
        if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.type !== 'application/pdf') {
                showStatus('error', 'File must be a PDF.');
                return;
            }

            showStatus('info', 'Uploading replacement file...');
            const uploadedFile = await replaceFile(fileId, file, title);
            newUrl = uploadedFile.url;
            fileWasReplaced = true;
        }

        showStatus('info', 'Updating COA page...');

        // Update page
        await updateCOAPage('modify', {
            id: fileId,
            oldTitle: existingFile.title,
            title: title,
            url: newUrl,
            testDate: testDate,
            description: description
        });

        // Only generate new QR if file was replaced (not for metadata-only updates)
        if (fileWasReplaced) {
            showStatus('info', 'Generating QR code for new file...');
            await generateQRCode(newUrl, title);
            showStatus('success', `Updated '${title}' successfully. New QR code downloaded!`);
        } else {
            showStatus('success', `Updated '${title}' successfully.`);
        }

        clearForm();
        document.getElementById('actionSelect').value = '';
        handleActionChange({ target: { value: '' } });

    } catch (error) {
        showStatus('error', `Failed to modify COA: ${error.message}`);
    }
}

async function handleSubmitDelete() {
    const fileId = document.getElementById('deleteFileSelect').value;
    const confirmed = document.getElementById('deleteConfirm').checked;

    if (!fileId) {
        showStatus('error', 'Please select a COA to delete.');
        return;
    }

    if (!confirmed) {
        showStatus('error', 'Please confirm deletion by checking the box.');
        return;
    }

    const file = state.existingFiles.find(f => f.id === fileId);
    if (!file) {
        showStatus('error', 'Selected file not found.');
        return;
    }

    showStatus('info', 'Deleting file from Shopify...');

    try {
        // Delete file
        await deleteFile(fileId);

        showStatus('info', 'File deleted. Updating COA page...');

        // Update page
        await updateCOAPage('delete', {
            id: fileId,
            title: file.title
        });

        showStatus('success', `Deleted '${file.title}' from Shopify and page.`);
        clearForm();
        document.getElementById('actionSelect').value = '';
        handleActionChange({ target: { value: '' } });

    } catch (error) {
        showStatus('error', `Failed to delete COA: ${error.message}`);
    }
}

// ============================================================================
// SHOPIFY API - GRAPHQL (via Netlify Proxy)
// ============================================================================

async function makeGraphQLRequest(query, variables = {}) {
    const response = await fetch(CONFIG.API_GRAPHQL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            domain: state.domain,
            token: state.token,
            query,
            variables
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
        throw new Error(data.errors.map(e => e.message).join(', '));
    }

    return data;
}

async function loadExistingFiles(selectId) {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = '<option value="">-- Loading files... --</option>';

    try {
        const result = await makeGraphQLRequest(`
            {
                files(first: 250, query: "media_type:GENERIC_FILE") {
                    edges {
                        node {
                            id
                            alt
                            createdAt
                            ... on GenericFile {
                                url
                                originalFileSize
                                mimeType
                                originalFileName
                            }
                        }
                    }
                }
            }
        `);

        const allFiles = result.data.files.edges.map(edge => edge.node);

        // Filter for PDFs only
        const pdfFiles = allFiles.filter(file =>
            file.mimeType === 'application/pdf' ||
            (file.url && file.url.toLowerCase().endsWith('.pdf'))
        );

        state.existingFiles = pdfFiles.map(file => ({
            id: file.id,
            title: file.alt || file.originalFileName || 'Untitled',
            filename: file.originalFileName || '',
            url: file.url,
            createdAt: file.createdAt,
            testDate: '', // Will be extracted from page if available
            description: ''
        }));

        // Sort alphabetically
        state.existingFiles.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

        // Populate dropdown
        selectElement.innerHTML = '<option value="">-- Select a file --</option>';
        state.existingFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.id;
            // Show both title and filename if they're different
            if (file.title && file.filename && file.title !== file.filename) {
                option.textContent = `${file.title} (${file.filename})`;
            } else if (file.title) {
                option.textContent = file.title;
            } else if (file.filename) {
                option.textContent = file.filename;
            } else {
                option.textContent = 'Untitled';
            }
            selectElement.appendChild(option);
        });

    } catch (error) {
        selectElement.innerHTML = '<option value="">-- Error loading files --</option>';
        showStatus('error', `Failed to load files: ${error.message}`);
    }
}

async function uploadFile(file, altText) {
    // Step 1: Create staged upload
    const stagedUploadResult = await makeGraphQLRequest(`
        mutation {
            stagedUploadsCreate(input: {
                resource: FILE,
                filename: "${file.name}",
                mimeType: "${file.type}",
                httpMethod: POST
            }) {
                stagedTargets {
                    url
                    resourceUrl
                    parameters {
                        name
                        value
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `);

    if (stagedUploadResult.data.stagedUploadsCreate.userErrors.length > 0) {
        throw new Error(stagedUploadResult.data.stagedUploadsCreate.userErrors[0].message);
    }

    const stagedTarget = stagedUploadResult.data.stagedUploadsCreate.stagedTargets[0];

    // Step 2: Upload file to staged URL (directly, not through proxy)
    const formData = new FormData();
    stagedTarget.parameters.forEach(param => {
        formData.append(param.name, param.value);
    });
    formData.append('file', file);

    const uploadResponse = await fetch(stagedTarget.url, {
        method: 'POST',
        body: formData
    });

    if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
    }

    // Step 3: Create file in Shopify
    const createFileResult = await makeGraphQLRequest(`
        mutation fileCreate($files: [FileCreateInput!]!) {
            fileCreate(files: $files) {
                files {
                    id
                    alt
                    ... on GenericFile {
                        url
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `, {
        files: [{
            alt: altText,
            contentType: 'FILE',
            originalSource: stagedTarget.resourceUrl
        }]
    });

    if (createFileResult.data.fileCreate.userErrors.length > 0) {
        throw new Error(createFileResult.data.fileCreate.userErrors[0].message);
    }

    return createFileResult.data.fileCreate.files[0];
}

async function replaceFile(fileId, newFile, altText) {
    // Stage the new upload
    const stagedUploadResult = await makeGraphQLRequest(`
        mutation {
            stagedUploadsCreate(input: {
                resource: FILE,
                filename: "${newFile.name}",
                mimeType: "${newFile.type}",
                httpMethod: POST
            }) {
                stagedTargets {
                    url
                    resourceUrl
                    parameters {
                        name
                        value
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `);

    if (stagedUploadResult.data.stagedUploadsCreate.userErrors.length > 0) {
        throw new Error(stagedUploadResult.data.stagedUploadsCreate.userErrors[0].message);
    }

    const stagedTarget = stagedUploadResult.data.stagedUploadsCreate.stagedTargets[0];

    // Upload the new file (directly, not through proxy)
    const formData = new FormData();
    stagedTarget.parameters.forEach(param => {
        formData.append(param.name, param.value);
    });
    formData.append('file', newFile);

    const uploadResponse = await fetch(stagedTarget.url, {
        method: 'POST',
        body: formData
    });

    if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
    }

    // Update the existing file
    const updateResult = await makeGraphQLRequest(`
        mutation fileUpdate($files: [FileUpdateInput!]!) {
            fileUpdate(files: $files) {
                files {
                    id
                    alt
                    ... on GenericFile {
                        url
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `, {
        files: [{
            id: fileId,
            alt: altText,
            originalSource: stagedTarget.resourceUrl
        }]
    });

    if (updateResult.data.fileUpdate.userErrors.length > 0) {
        throw new Error(updateResult.data.fileUpdate.userErrors[0].message);
    }

    return updateResult.data.fileUpdate.files[0];
}

async function deleteFile(fileId) {
    const result = await makeGraphQLRequest(`
        mutation DeleteFiles($ids: [ID!]!) {
            fileDelete(fileIds: $ids) {
                deletedFileIds
                userErrors {
                    field
                    message
                }
            }
        }
    `, {
        ids: [fileId]
    });

    if (result.data.fileDelete.userErrors.length > 0) {
        throw new Error(result.data.fileDelete.userErrors[0].message);
    }

    return result.data.fileDelete.deletedFileIds;
}

// ============================================================================
// SHOPIFY API - REST (via Netlify Proxy)
// ============================================================================

async function makeRESTRequest(endpoint, method = 'GET', body = null) {
    const response = await fetch(CONFIG.API_REST, {
        method: 'POST', // Always POST to the proxy
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            domain: state.domain,
            token: state.token,
            endpoint,
            method,
            body
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
}

async function updateCOAPage(action, coaData) {
    // Get current page content
    const pageData = await makeRESTRequest(`pages/${CONFIG.PAGE_ID}.json`);
    const currentHTML = pageData.page.body_html;

    // Find comment markers
    const startMarker = '<!-- COA-LIST-START -->';
    const endMarker = '<!-- COA-LIST-END -->';

    const startIdx = currentHTML.indexOf(startMarker);
    const endIdx = currentHTML.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1) {
        throw new Error(`Comment markers not found in page. Please add:\n${startMarker}\n<ul id="coa-list"></ul>\n${endMarker}`);
    }

    // Extract current list
    const beforeList = currentHTML.substring(0, startIdx + startMarker.length);
    const afterList = currentHTML.substring(endIdx);
    const listSection = currentHTML.substring(startIdx + startMarker.length, endIdx);

    // Parse existing list items
    const listItems = parseListItems(listSection);

    // Update list based on action
    if (action === 'add') {
        listItems.push({
            id: coaData.id,
            title: coaData.title,
            url: coaData.url,
            testDate: coaData.testDate,
            description: coaData.description
        });
    } else if (action === 'modify') {
        const index = listItems.findIndex(item => item.id === coaData.id);
        if (index !== -1) {
            listItems[index] = {
                id: coaData.id,
                title: coaData.title,
                url: coaData.url,
                testDate: coaData.testDate,
                description: coaData.description
            };
        }
    } else if (action === 'delete') {
        const index = listItems.findIndex(item => item.id === coaData.id);
        if (index !== -1) {
            listItems.splice(index, 1);
        }
    }

    // Sort alphabetically by title
    listItems.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

    // Generate new HTML
    const newListHTML = generateListHTML(listItems);

    // Combine back together
    const newHTML = beforeList + '\n' + newListHTML + '\n' + afterList;

    // Update page
    await makeRESTRequest(`pages/${CONFIG.PAGE_ID}.json`, 'PUT', {
        page: {
            id: CONFIG.PAGE_ID,
            body_html: newHTML
        }
    });
}

function parseListItems(html) {
    const items = [];
    const liRegex = /<li[^>]*data-file-id="([^"]*)"[^>]*>(.*?)<\/li>/gi;
    let match;

    while ((match = liRegex.exec(html)) !== null) {
        const fileId = match[1];
        const content = match[2];

        // Extract URL and title from <a> tag
        const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/i;
        const linkMatch = content.match(linkRegex);

        if (linkMatch) {
            const url = linkMatch[1];
            const title = linkMatch[2].trim();

            // Extract test date
            const dateRegex = /\(test date:\s*([^\)]+)\)/i;
            const dateMatch = content.match(dateRegex);
            const testDate = dateMatch ? dateMatch[1].trim() : '';

            // Extract description (after date, starting with –)
            const descRegex = /\)\s*–\s*(.+)$/i;
            const descMatch = content.match(descRegex);
            const description = descMatch ? descMatch[1].trim() : '';

            items.push({
                id: fileId,
                title: title,
                url: url,
                testDate: testDate,
                description: description
            });
        }
    }

    return items;
}

function generateListHTML(items) {
    if (items.length === 0) {
        return '<ul id="coa-list">\n</ul>';
    }

    let html = '<ul id="coa-list">\n';

    items.forEach(item => {
        // Sanitize all fields
        const safeTitle = escapeHTML(item.title);
        const safeUrl = escapeHTML(item.url);
        const safeDate = item.testDate ? escapeHTML(item.testDate) : '';
        const safeDesc = item.description ? escapeHTML(item.description) : '';

        let li = `  <li data-file-id="${escapeHTML(item.id)}">`;
        li += `<a href="${safeUrl}" target="_blank" rel="noopener">${safeTitle}</a>`;

        if (safeDate) {
            li += ` (test date: ${safeDate})`;
        }

        if (safeDesc) {
            li += ` – ${safeDesc}`;
        }

        li += '</li>\n';
        html += li;
    });

    html += '</ul>';
    return html;
}

// ============================================================================
// QR CODE GENERATION
// ============================================================================

async function generateQRCode(url, title) {
    try {
        // Generate QR code using QRCode library
        const canvas = document.createElement('canvas');

        await QRCode.toCanvas(canvas, url, {
            width: CONFIG.QR_SIZE,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

        // Create filename
        const filename = `${sanitizeFilename(title)}_QR.png`;

        // Download the QR code
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        // Show preview
        showQRPreview(canvas, title);

        // Store for later reference
        state.lastQRCode = {
            url,
            title,
            dataURL: canvas.toDataURL('image/png')
        };

        return true;

    } catch (error) {
        console.error('QR Code generation error:', error);
        showStatus('warning', `COA uploaded successfully, but QR code generation failed: ${error.message}`);
        return false;
    }
}

function showQRPreview(canvas, title) {
    // Check if preview section exists, create if not
    let previewSection = document.getElementById('qrPreview');

    if (!previewSection) {
        // Create preview section
        previewSection = document.createElement('div');
        previewSection.id = 'qrPreview';
        previewSection.className = 'bg-white rounded-lg shadow-md p-6 mb-6';

        // Insert after main section
        const mainSection = document.getElementById('mainSection');
        mainSection.parentNode.insertBefore(previewSection, mainSection.nextSibling);
    }

    // Update preview content
    previewSection.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-900 mb-4">QR Code Generated</h2>
        <div class="flex flex-col items-center gap-4">
            <div class="border-2 border-gray-300 rounded-lg p-4 bg-white">
                ${canvas.outerHTML}
            </div>
            <p class="text-sm text-gray-600">
                QR code for <strong>${escapeHTML(title)}</strong> has been downloaded as <code>${sanitizeFilename(title)}_QR.png</code>
            </p>
            <p class="text-xs text-gray-500">
                Scan this QR code with a smartphone to open the PDF directly.
            </p>
        </div>
    `;

    previewSection.style.display = 'block';
}

function sanitizeFilename(filename) {
    // Remove or replace characters not suitable for filenames
    return filename
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    const timestamp = date.getTime();

    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
        return false;
    }

    return dateString === date.toISOString().split('T')[0];
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showStatus(type, message) {
    const statusArea = document.getElementById('statusArea');

    const alertClasses = {
        success: 'bg-green-50 border-green-200 text-green-900',
        error: 'bg-red-50 border-red-200 text-red-900',
        info: 'bg-blue-50 border-blue-200 text-blue-900',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-900'
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message p-4 rounded-md border-2 ${alertClasses[type]} mb-4`;
    statusDiv.innerHTML = `
        <div class="flex items-start gap-3">
            <span class="text-xl font-bold">${icons[type]}</span>
            <div class="flex-1">
                <p class="font-medium">${escapeHTML(message)}</p>
            </div>
        </div>
    `;

    statusArea.innerHTML = '';
    statusArea.appendChild(statusDiv);

    // Auto-remove after 10 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.style.transition = 'opacity 0.5s';
            statusDiv.style.opacity = '0';
            setTimeout(() => statusDiv.remove(), 500);
        }, 10000);
    }
}

// ============================================================================
// CONNECTION STATUS
// ============================================================================

function updateConnectionStatus(message, isError = false) {
    const statusEl = document.getElementById('connectionStatus');
    if (isError) {
        statusEl.innerHTML = `<span class="text-red-600">✕ ${escapeHTML(message)}</span>`;
    } else {
        statusEl.innerHTML = `<span class="text-green-600">✓ ${escapeHTML(message)}</span>`;
    }
}
