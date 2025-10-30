// Netlify Function - Shopify REST API Proxy
// Proxies REST requests to Shopify Admin API to avoid CORS issues

exports.handler = async (event, context) => {
  // Allow GET, POST, PUT, DELETE
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

  if (!allowedMethods.includes(event.httpMethod)) {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const { domain, token, endpoint, method, body } = JSON.parse(event.body);

    // Validate required fields
    if (!domain || !token || !endpoint || !method) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: domain, token, endpoint, method' })
      };
    }

    // Build Shopify URL
    const shopifyUrl = `https://${domain}/admin/api/2024-10/${endpoint}`;

    // Prepare fetch options
    const fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      }
    };

    // Add body if provided
    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Make request to Shopify REST API
    const response = await fetch(shopifyUrl, fetchOptions);

    const data = await response.json();

    // Return Shopify's response
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Shopify REST Proxy Error:', error);
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
