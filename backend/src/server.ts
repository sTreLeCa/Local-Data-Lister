// backend/src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';

import { LocalItem } from '@local-data/types';
import { searchYelp, YelpSearchParameters, YelpErrorResponse } from './services/yelpService';
import { transformYelpResponseToLocalItems } from './services/dataTransformer';

const app = express();

// Middleware
app.use(cors()); // Enable All CORS Requests
app.use(express.json()); // Middleware to parse JSON bodies

// --- Utility Functions for Validation ---
const isValidNumber = (value: string | undefined): boolean => {
  return value !== undefined && !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
};

const isValidInteger = (value: string | undefined): boolean => {
  return value !== undefined && Number.isInteger(parseFloat(value)) && parseFloat(value) >= 0;
};

// --- Health Check / Root Route ---
app.get('/', (req: Request, res: Response) => {
  console.log('[API /] Health check endpoint accessed');
  res.send('Backend server is running!');
});

// --- API Endpoint for Local JSON Data ---
app.get('/api/local-items', async (req: Request, res: Response) => {
  console.log('[API /api/local-items] Fetching local items data');
  
  try {
    const filePath = path.join(__dirname, 'data', 'local-items.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Basic check for empty file content that would cause JSON.parse to error
    if (!fileContent.trim()) {
      console.error('[API /api/local-items] Local items data file is empty');
      return res.status(500).json({ 
        message: 'Error fetching local items: data source is empty.',
        code: 'EMPTY_DATA_FILE'
      });
    }
    
    const items: LocalItem[] = JSON.parse(fileContent);
    console.log(`[API /api/local-items] Successfully returned ${items.length} local items`);
    res.status(200).json(items);
    
  } catch (error) {
    console.error('[API /api/local-items] Failed to read or parse local items data:', error);
    res.status(500).json({ 
      message: 'Error fetching local items data.',
      code: 'DATA_READ_ERROR'
    });
  }
});

// --- API Endpoint: Fetch items from External API (Yelp) ---
app.get('/api/external/items', async (req: Request, res: Response) => {
  console.log('[API /api/external/items] Processing external items request with query params:', req.query);
  
  // 1. Extract query parameters
  const {
    location,       // string: e.g., "New York", "NYC", "SoHo, New York"
    term,           // string: e.g., "restaurants", "parks", "coffee"
    latitude,       // string (parsed to number): e.g., "40.7128"
    longitude,      // string (parsed to number): e.g., "-74.0060"
    limit,          // string (parsed to number): e.g., "10" (default 20, max 50)
    offset,         // string (parsed to number): e.g., "0" (for pagination)
    categories,     // string: comma-separated Yelp category aliases, e.g., "restaurants,bars"
  } = req.query;

  // 2. Enhanced query parameter validation
  
  // Validate that either location or geographical coordinates are provided
  if (!location && (!latitude || !longitude)) {
    console.warn('[API /api/external/items] Missing required location parameters');
    return res.status(400).json({
      message: 'Missing required query parameters: either "location" (string) or both "latitude" and "longitude" (numbers) must be provided.',
      code: 'MISSING_LOCATION_PARAMS'
    });
  }

  // Validate latitude and longitude if provided
  if ((latitude || longitude) && (!isValidNumber(latitude as string) || !isValidNumber(longitude as string))) {
    console.warn('[API /api/external/items] Invalid latitude/longitude format:', { latitude, longitude });
    return res.status(400).json({
      message: 'Invalid latitude/longitude format. Both must be valid numbers.',
      code: 'INVALID_COORDINATES'
    });
  }

  // Validate limit parameter
  if (limit && !isValidInteger(limit as string)) {
    console.warn('[API /api/external/items] Invalid limit parameter:', limit);
    return res.status(400).json({
      message: 'Invalid limit parameter. Must be a positive integer.',
      code: 'INVALID_LIMIT'
    });
  }

  // Validate offset parameter
  if (offset && !isValidInteger(offset as string)) {
    console.warn('[API /api/external/items] Invalid offset parameter:', offset);
    return res.status(400).json({
      message: 'Invalid offset parameter. Must be a non-negative integer.',
      code: 'INVALID_OFFSET'
    });
  }

  // 3. Construct search parameters for the Yelp service
  const searchParams: YelpSearchParameters = {};

  if (term) {
    searchParams.term = (term as string).trim();
    if (searchParams.term.length === 0) {
      console.warn('[API /api/external/items] Empty term parameter provided');
      return res.status(400).json({
        message: 'Term parameter cannot be empty.',
        code: 'EMPTY_TERM'
      });
    }
  }
  
  if (categories) {
    searchParams.categories = (categories as string).trim();
    if (searchParams.categories.length === 0) {
      console.warn('[API /api/external/items] Empty categories parameter provided');
      return res.status(400).json({
        message: 'Categories parameter cannot be empty.',
        code: 'EMPTY_CATEGORIES'
      });
    }
  }

  // Parse and validate limit with enhanced bounds checking
  const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
  if (parsedLimit < 1 || parsedLimit > 50) {
    console.warn('[API /api/external/items] Limit out of bounds:', parsedLimit);
    return res.status(400).json({
      message: 'Limit must be between 1 and 50.',
      code: 'LIMIT_OUT_OF_BOUNDS'
    });
  }
  searchParams.limit = parsedLimit;

  // Parse and validate offset
  if (offset) {
    const parsedOffset = parseInt(offset as string, 10);
    if (parsedOffset < 0) {
      console.warn('[API /api/external/items] Negative offset provided:', parsedOffset);
      return res.status(400).json({
        message: 'Offset must be non-negative.',
        code: 'NEGATIVE_OFFSET'
      });
    }
    searchParams.offset = parsedOffset;
  }
  
  // Handle location vs coordinates with enhanced validation
  if (latitude && longitude) {
    const parsedLat = parseFloat(latitude as string);
    const parsedLon = parseFloat(longitude as string);
    
    // Additional bounds checking for realistic coordinates
    if (parsedLat < -90 || parsedLat > 90) {
      console.warn('[API /api/external/items] Latitude out of valid range:', parsedLat);
      return res.status(400).json({
        message: 'Latitude must be between -90 and 90 degrees.',
        code: 'INVALID_LATITUDE_RANGE'
      });
    }
    
    if (parsedLon < -180 || parsedLon > 180) {
      console.warn('[API /api/external/items] Longitude out of valid range:', parsedLon);
      return res.status(400).json({
        message: 'Longitude must be between -180 and 180 degrees.',
        code: 'INVALID_LONGITUDE_RANGE'
      });
    }
    
    searchParams.latitude = parsedLat;
    searchParams.longitude = parsedLon;
    console.log(`[API /api/external/items] Using coordinates: lat=${parsedLat}, lon=${parsedLon}`);
    
  } else if (location) {
    const trimmedLocation = (location as string).trim();
    if (trimmedLocation.length === 0) {
      console.warn('[API /api/external/items] Empty location parameter provided');
      return res.status(400).json({
        message: 'Location parameter cannot be empty.',
        code: 'EMPTY_LOCATION'
      });
    }
    searchParams.location = trimmedLocation;
    console.log(`[API /api/external/items] Using location: ${trimmedLocation}`);
  }

  try {
    // 4. Call the external API service (yelpService)
    console.log(`[API /api/external/items] Calling Yelp service with validated params:`, searchParams);
    const yelpApiResponse = await searchYelp(searchParams);

    // 5. Transform the raw API response into our LocalItem[] format
    const localItems: LocalItem[] = transformYelpResponseToLocalItems(yelpApiResponse);
    
    console.log(`[API /api/external/items] Successfully transformed ${localItems.length} items from Yelp response (total available: ${yelpApiResponse.total})`);
    
    // 6. Respond with the transformed items and metadata
    res.status(200).json({
      items: localItems,
      totalResultsFromSource: yelpApiResponse.total, // Useful for frontend pagination
      source: 'live', // Relevant for future caching implementation
      requestParams: {
        limit: searchParams.limit,
        offset: searchParams.offset || 0,
      }
    });

  } catch (error) {
    // 7. Enhanced error handling with consistent logging and response format
    console.error('[API /api/external/items] Error occurred:', error);

    if (error instanceof Error) {
      // Handle known Yelp API error responses with detailed parsing
      if (error.message.startsWith('Yelp API request failed')) {
        console.error('[API /api/external/items] Yelp API error detected');
        
        try {
          // Extract status code from error message
          const statusMatch = error.message.match(/status (\d+)/);
          const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 502;

          // Extract and parse JSON error details
          const jsonStartIndex = error.message.indexOf('{');
          if (jsonStartIndex !== -1) {
            const jsonErrorString = error.message.substring(jsonStartIndex);
            const yelpErrorDetails = JSON.parse(jsonErrorString) as YelpErrorResponse;

            console.error('[API /api/external/items] Parsed Yelp error details:', yelpErrorDetails);

            return res.status(statusCode).json({
              message: `External API error: ${yelpErrorDetails.error?.description || 'Details unavailable'}`,
              code: yelpErrorDetails.error?.code || 'EXTERNAL_API_ERROR',
              source: 'yelp',
              details: yelpErrorDetails,
            });
          }
        } catch (parseError) {
          console.error('[API /api/external/items] Failed to parse Yelp error details:', parseError);
          return res.status(502).json({ 
            message: 'Error communicating with external service. Could not parse error details.',
            code: 'EXTERNAL_API_PARSE_ERROR',
            source: 'yelp',
            rawError: error.message 
          });
        }
      }
      
      // Handle network or other service errors
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.error('[API /api/external/items] Network connectivity error');
        return res.status(503).json({
          message: 'External service temporarily unavailable. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          source: 'yelp'
        });
      }
    }

    // Generic internal server error for unhandled cases
    console.error('[API /api/external/items] Unhandled error, returning generic server error');
    res.status(500).json({ 
      message: 'Failed to fetch external items due to an internal server error.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// --- TEMPORARY TEST ROUTE for Yelp Service ---
// Protected for development environment only
app.get('/api/test-yelp', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[API /api/test-yelp] Unauthorized access attempt in non-development environment');
    return res.status(403).json({ 
      message: 'Forbidden in this environment',
      code: 'ENVIRONMENT_RESTRICTED'  
    });
  }
  
  console.log('[API /api/test-yelp] Test endpoint accessed with query:', req.query);
  
  try {
    const params: YelpSearchParameters = {
      location: (req.query.location as string) || 'San Francisco',
      term: (req.query.term as string) || 'restaurants',
      limit: 3, // Keep it small for testing
    };
    
    console.log(`[API /api/test-yelp] Calling Yelp service with test params:`, params);
    const yelpData = await searchYelp(params);
    console.log(`[API /api/test-yelp] Successfully retrieved test data`);
    
    res.json({
      message: 'Test successful',
      data: yelpData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[API /api/test-yelp] Test endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: 'Failed to fetch data from Yelp (test route)', 
      code: 'TEST_ENDPOINT_ERROR',
      error: errorMessage 
    });
  }
});

export default app;