import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateLicense, extractToken } from './utils/license';
import { createErrorResponse, logError } from './utils/errors';

interface AiCommandRequest {
  prompt: string;
  context?: Record<string, unknown>;
}

interface AiCommandResponse {
  result: unknown;
}

/**
 * Netlify Function: aiCommand
 * 
 * Proxies requests to Google Gemini API
 * 
 * POST /.netlify/functions/aiCommand
 * Headers:
 *   Authorization: Bearer <license-token>
 *   Content-Type: application/json
 * Body:
 *   {
 *     "prompt": "string",
 *     "context": { ... } // optional
 *   }
 */
export const handler: Handler = async (event, context) => {
  // CORS headers for Adobe UXP plugin
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed', message: 'Only POST requests are allowed' }),
    };
  }

  try {
    // Validate license
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = extractToken(authHeader);
    const licenseCheck = validateLicense(token);

    if (!licenseCheck.valid) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: licenseCheck.reason || 'Invalid license',
        }),
      };
    }

    // Parse and validate request body
    let body: AiCommandRequest;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON in request body' }),
      };
    }

    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Bad Request', message: 'Missing or invalid "prompt" field' }),
      };
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logError('GEMINI_API_KEY not set in environment variables', 'aiCommand');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Server configuration error' }),
      };
    }

    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build the prompt (you can extend this to include context)
    let fullPrompt = body.prompt;
    if (body.context) {
      // Add context to the prompt if provided
      fullPrompt = `Context: ${JSON.stringify(body.context)}\n\nUser Request: ${body.prompt}`;
    }

    // Call Gemini API
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Return cleaned response
    const apiResponse: AiCommandResponse = {
      result: text,
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiResponse),
    };
  } catch (error) {
    logError(error, 'aiCommand');

    // Don't leak internal error details
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An error occurred processing your request',
      }),
    };
  }
};

