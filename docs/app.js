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
        showStatus('error', 'Please select a COA to replace.');
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

    // Note: When replacing, we intentionally allow using the same title.
    // Users typically replace a file with an updated version of the same document.
    // The updated date will indicate to clients that the document has been updated.

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
        showStatus('error', `Failed to replace COA: ${error.message}`);
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

        state.existingFiles = pdfFiles.map(file => {
            // Extract filename from URL
            const filename = file.url ? extractFilenameFromURL(file.url) : '';

            return {
                id: file.id,
                title: file.alt || filename || 'Untitled',
                filename: filename,
                url: file.url,
                createdAt: file.createdAt,
                testDate: '', // Will be extracted from page if available
                description: ''
            };
        });

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

    const uploadedFile = createFileResult.data.fileCreate.files[0];

    // If URL is not available yet, wait and refetch
    if (!uploadedFile.url) {
        console.log('URL not available immediately, waiting and refetching...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const refetchResult = await makeGraphQLRequest(`
            {
                node(id: "${uploadedFile.id}") {
                    ... on GenericFile {
                        id
                        alt
                        url
                    }
                }
            }
        `);

        if (refetchResult.data.node && refetchResult.data.node.url) {
            return refetchResult.data.node;
        }
    }

    return uploadedFile;
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

    const updatedFile = updateResult.data.fileUpdate.files[0];

    // If URL is not available yet, wait and refetch
    if (!updatedFile.url) {
        console.log('URL not available immediately after update, waiting and refetching...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const refetchResult = await makeGraphQLRequest(`
            {
                node(id: "${updatedFile.id}") {
                    ... on GenericFile {
                        id
                        alt
                        url
                    }
                }
            }
        `);

        if (refetchResult.data.node && refetchResult.data.node.url) {
            return refetchResult.data.node;
        }
    }

    return updatedFile;
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
    console.log('=== Update COA Page Debug ===');
    console.log('Action:', action);
    console.log('List section HTML:', listSection);
    console.log('Parsed existing items:', listItems.length, 'items');
    console.log('Existing items:', listItems.map(item => ({ title: item.title, id: item.id })));

    // Update list based on action
    if (action === 'add') {
        console.log('Adding new item:', { title: coaData.title, id: coaData.id });
        listItems.push({
            id: coaData.id,
            title: coaData.title,
            url: coaData.url,
            testDate: coaData.testDate,
            description: coaData.description
        });
        console.log('After adding, total items:', listItems.length);
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
    console.log('After sorting:', listItems.map(item => item.title));

    // Generate new HTML
    const newListHTML = generateListHTML(listItems);
    console.log('Generated HTML length:', newListHTML.length, 'characters');
    console.log('Generated HTML:', newListHTML);

    // Combine back together
    const newHTML = beforeList + '\n' + newListHTML + '\n' + afterList;
    console.log('=== End Update COA Page Debug ===');

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

    // Try to match items WITH data-file-id first
    // Use [\s\S] instead of . to match newlines
    const liWithIdRegex = /<li[^>]*data-file-id="([^"]*)"[^>]*>([\s\S]*?)<\/li>/gi;
    let match;

    while ((match = liWithIdRegex.exec(html)) !== null) {
        const fileId = match[1];
        const content = match[2];

        // Extract URL and title from <a> tag
        const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
        const linkMatch = content.match(linkRegex);

        if (linkMatch) {
            const url = linkMatch[1];
            const title = unescapeHTML(linkMatch[2].trim());

            // Extract test date
            const dateRegex = /\(test date:\s*([^\)]+)\)/i;
            const dateMatch = content.match(dateRegex);
            const testDate = dateMatch ? unescapeHTML(dateMatch[1].trim()) : '';

            // Extract description (after date, starting with –)
            // Use [\s\S] to match content across lines
            const descRegex = /\)\s*–\s*([\s\S]+)$/i;
            const descMatch = content.match(descRegex);
            const description = descMatch ? unescapeHTML(descMatch[1].trim()) : '';

            items.push({
                id: fileId,
                title: title,
                url: url,
                testDate: testDate,
                description: description
            });
        }
    }

    // Also match items WITHOUT data-file-id (manually added)
    // Extract all <li> items and skip ones we already have
    // Use [\s\S] instead of . to match newlines
    const allLiRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const existingIds = new Set(items.map(item => item.id));

    html.replace(allLiRegex, (fullMatch, content) => {
        // Skip if this item already has a file-id and was processed
        if (fullMatch.includes('data-file-id=')) {
            return fullMatch;
        }

        // Extract URL and title from <a> tag
        const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
        const linkMatch = content.match(linkRegex);

        if (linkMatch) {
            const url = linkMatch[1];
            const title = unescapeHTML(linkMatch[2].trim());

            // Extract test date
            const dateRegex = /\(test date:\s*([^\)]+)\)/i;
            const dateMatch = content.match(dateRegex);
            const testDate = dateMatch ? unescapeHTML(dateMatch[1].trim()) : '';

            // Extract description (after date, starting with –)
            // Use [\s\S] to match content across lines
            const descRegex = /\)\s*–\s*([\s\S]+)$/i;
            const descMatch = content.match(descRegex);
            const description = descMatch ? unescapeHTML(descMatch[1].trim()) : '';

            // Generate a pseudo-ID from the URL for manually added items
            const pseudoId = 'manual-' + btoa(url).substring(0, 20);

            items.push({
                id: pseudoId,
                title: title,
                url: url,
                testDate: testDate,
                description: description,
                isManual: true  // Flag for manually added items
            });
        }

        return fullMatch;
    });

    return items;
}

function generateListHTML(items) {
    if (items.length === 0) {
        return '<ul id="coa-list">\n</ul>';
    }

    let html = '<ul id="coa-list">\n';

    items.forEach(item => {
        // Sanitize text fields but NOT URLs
        const safeTitle = escapeHTML(item.title);
        const safeUrl = item.url; // URLs should not be HTML-escaped, just used as-is
        const safeDate = item.testDate ? escapeHTML(item.testDate) : '';
        const safeDesc = item.description ? escapeHTML(item.description) : '';

        // Only add data-file-id if it's not a manually added item
        const dataFileId = item.isManual ? '' : ` data-file-id="${escapeHTML(item.id)}"`;
        let li = `  <li${dataFileId}>`;
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
// QR CODE GENERATION (using API - no library needed)
// ============================================================================

async function generateQRCode(url, title) {
    console.log('=== QR Code Generation Started ===');
    console.log('URL:', url);
    console.log('Title:', title);

    try {
        // Use QR Server API to generate QR code (no library needed!)
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${CONFIG.QR_SIZE}x${CONFIG.QR_SIZE}&format=png&data=${encodeURIComponent(url)}`;

        console.log('Fetching QR code from API...');
        const response = await fetch(qrApiUrl);

        if (!response.ok) {
            throw new Error('QR code API request failed');
        }

        const blob = await response.blob();
        console.log('QR code blob received:', blob.size, 'bytes');

        // Create filename
        const filename = `${sanitizeFilename(title)}_QR.png`;
        console.log('Filename:', filename);

        // Download the QR code
        console.log('Starting download...');
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        console.log('Download triggered');
        document.body.removeChild(a);

        // Create a separate blob URL for preview (don't revoke the download one yet)
        const previewUrl = URL.createObjectURL(blob);

        // Show preview
        console.log('Showing QR preview...');
        showQRPreview(previewUrl, qrApiUrl, title, filename);
        console.log('=== QR Code Generation Complete ===');

        // Store for later reference
        state.lastQRCode = {
            url,
            title,
            imageUrl: qrApiUrl,
            filename
        };

        // Revoke download URL after delay
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

        return true;

    } catch (error) {
        console.error('=== QR Code Generation Failed ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        showStatus('error', `QR code generation failed: ${error.message}. Check browser console for details.`);
        return false;
    }
}

function showQRPreview(imageUrl, apiUrl, title, filename) {
    console.log('showQRPreview called with title:', title);
    console.log('Image URL:', imageUrl);

    // Check if preview section exists, create if not
    let previewSection = document.getElementById('qrPreview');

    if (!previewSection) {
        console.log('Creating new QR preview section');
        // Create preview section
        previewSection = document.createElement('div');
        previewSection.id = 'qrPreview';
        previewSection.className = 'bg-white rounded-lg shadow-md p-6 mb-6';

        // Insert after status area to make it more visible
        const statusArea = document.getElementById('statusArea');
        if (statusArea && statusArea.parentNode) {
            statusArea.parentNode.insertBefore(previewSection, statusArea.nextSibling);
            console.log('QR preview section inserted into DOM');
        } else {
            console.error('Could not find statusArea to insert QR preview');
            return;
        }
    } else {
        console.log('Using existing QR preview section');
    }

    console.log('Generated filename:', filename);

    // Update preview content with download button
    previewSection.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-900 mb-4">✅ QR Code Generated</h2>
        <div class="flex flex-col md:flex-row gap-6 items-center">
            <div class="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                <img src="${imageUrl}" alt="QR Code for ${escapeHTML(title)}" width="${CONFIG.QR_SIZE}" height="${CONFIG.QR_SIZE}" />
            </div>
            <div class="flex-1 space-y-4">
                <div>
                    <p class="text-lg font-semibold text-gray-900 mb-2">
                        ${escapeHTML(title)}
                    </p>
                    <p class="text-sm text-gray-600 mb-1">
                        ✓ QR code auto-downloaded as:
                    </p>
                    <p class="text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                        ${filename}
                    </p>
                </div>
                <div class="pt-2">
                    <button
                        onclick="downloadQRCodeFromUrl('${apiUrl.replace(/'/g, "\\'")}', '${filename.replace(/'/g, "\\'")}');"
                        class="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition text-base"
                    >
                        📥 Download QR Code Again
                    </button>
                </div>
                <p class="text-xs text-gray-500 pt-2">
                    💡 Scan this QR code with a smartphone to open the PDF directly.
                </p>
            </div>
        </div>
    `;

    previewSection.style.display = 'block';
    console.log('QR preview section made visible');

    // Scroll to the QR preview
    setTimeout(() => {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('Scrolled to QR preview');
    }, 100);
}

function sanitizeFilename(filename) {
    // Remove or replace characters not suitable for filenames
    return filename
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

async function downloadQRCodeFromUrl(apiUrl, filename) {
    // Download QR code from API URL
    try {
        const response = await fetch(apiUrl);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (error) {
        console.error('Download failed:', error);
        showStatus('error', 'Failed to download QR code. Please try again.');
    }
}

function downloadQRCode(dataURL, filename) {
    // Manual download function for QR code (legacy)
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractFilenameFromURL(url) {
    try {
        // Extract filename from URL path
        // e.g., "https://cdn.shopify.com/.../files/BlackAmber_COA.pdf" -> "BlackAmber_COA.pdf"
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        // Decode URL encoding (e.g., %20 -> space)
        return decodeURIComponent(filename);
    } catch (error) {
        console.error('Error extracting filename from URL:', error);
        return '';
    }
}

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

function unescapeHTML(str) {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent;
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
