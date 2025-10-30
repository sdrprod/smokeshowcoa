// Netlify Function - File Upload Proxy
// Proxies file uploads to Shopify's staged upload URLs

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse request body
    const { url, formData } = JSON.parse(event.body);

    // Validate required fields
    if (!url || !formData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: url, formData' })
      };
    }

    // Build FormData for upload
    const form = new FormData();

    // Add all parameters
    if (formData.parameters) {
      formData.parameters.forEach(param => {
        form.append(param.name, param.value);
      });
    }

    // Add file (base64 encoded from client)
    if (formData.file) {
      const buffer = Buffer.from(formData.file.data, 'base64');
      const blob = new Blob([buffer], { type: formData.file.type });
      form.append('file', blob, formData.file.name);
    }

    // Upload to Shopify's staged URL
    const response = await fetch(url, {
      method: 'POST',
      body: form
    });

    // Return response
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify({
        success: response.ok,
        status: response.status
      })
    };

  } catch (error) {
    console.error('File Upload Proxy Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
