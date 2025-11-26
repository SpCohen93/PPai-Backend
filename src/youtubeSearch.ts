import { Handler } from '@netlify/functions';
import { validateLicense, extractToken } from './utils/license';
import { createErrorResponse, logError } from './utils/errors';

interface YouTubeSearchRequest {
  query: string;
}

interface YouTubeSearchResult {
  title: string;
  url: string;
  channel: string;
  thumbnails: {
    default?: string;
    medium?: string;
    high?: string;
  };
}

interface YouTubeSearchResponse {
  results: YouTubeSearchResult[];
}

interface YouTubeApiResponse {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        default?: { url?: string };
        medium?: { url?: string };
        high?: { url?: string };
      };
    };
  }>;
}

/**
 * Netlify Function: youtubeSearch
 * 
 * Searches YouTube using the YouTube Data API v3
 * 
 * POST /.netlify/functions/youtubeSearch
 * Headers:
 *   Authorization: Bearer <license-token>
 *   Content-Type: application/json
 * Body:
 *   {
 *     "query": "search query string"
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
    let body: YouTubeSearchRequest;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON in request body' }),
      };
    }

    if (!body.query || typeof body.query !== 'string' || body.query.trim().length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Bad Request', message: 'Missing or invalid "query" field' }),
      };
    }

    // Get API key from environment
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      logError('YOUTUBE_API_KEY not set in environment variables', 'youtubeSearch');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Server configuration error' }),
      };
    }

    // Call YouTube Data API v3
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', body.query);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', '10');
    searchUrl.searchParams.set('key', apiKey);

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`YouTube API error: ${response.status} ${errorText}`, 'youtubeSearch');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to search YouTube',
        }),
      };
    }

    const data = await response.json() as YouTubeApiResponse;

    // Transform YouTube API response to our simplified format
    const results: YouTubeSearchResult[] = (data.items || []).map((item) => ({
      title: item.snippet?.title || '',
      url: `https://www.youtube.com/watch?v=${item.id?.videoId || ''}`,
      channel: item.snippet?.channelTitle || '',
      thumbnails: {
        default: item.snippet?.thumbnails?.default?.url,
        medium: item.snippet?.thumbnails?.medium?.url,
        high: item.snippet?.thumbnails?.high?.url,
      },
    }));

    const apiResponse: YouTubeSearchResponse = {
      results,
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
    logError(error, 'youtubeSearch');

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

