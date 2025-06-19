import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';

import { LocalItem } from '@local-data/types';
import { searchFoursquare, FoursquareSearchParams, FoursquareErrorResponse } from './services/foursquareService';
import { transformFoursquareResponseToLocalItems } from './services/dataTransformer';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// --- Utility Functions for Validation ---
const isValidNumber = (value: string | undefined): boolean => {
  if (!value) return false;
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
};

const isValidInteger = (value: string | undefined): boolean => {
  if (!value) return false;
  const num = parseFloat(value);
  return Number.isInteger(num) && num >= 0;
};

const sanitizeString = (value: string | undefined): string | null => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// --- Health Check / Root Route ---
app.get('/', (req: Request, res: Response) => {
  console.log('[API /] Health check endpoint accessed');
  res.status(200).json({
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// --- API Endpoint for Local JSON Data ---
app.get('/api/local-items', async (req: Request, res: Response) => {
  console.log('[API /api/local-items] Fetching local items data');
  
  try {
    const filePath = path.join(__dirname, 'data', 'local-items.json');
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.error('[API /api/local-items] Local items data file not found');
      return res.status(404).json({
        message: 'Local items data file not found.',
        code: 'DATA_FILE_NOT_FOUND'
      });
    }
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    if (!fileContent.trim()) {
      console.error('[API /api/local-items] Local items data file is empty');
      return res.status(500).json({
        message: 'Error fetching local items: data source is empty.',
        code: 'EMPTY_DATA_FILE'
      });
    }
    
    let items: LocalItem[];
    try {
      items = JSON.parse(fileContent);
    } catch (parseError) {
      console.error('[API /api/local-items] Failed to parse JSON:', parseError);
      return res.status(500).json({
        message: 'Error parsing local items data.',
        code: 'JSON_PARSE_ERROR'
      });
    }
    
    // --- ADDED FINAL CHECK ---
    if (!Array.isArray(items)) {
      console.error("CRITICAL BACKEND ERROR: local-items.json did not parse to an array. Parsed value:", items);
      return res.status(500).json({ message: "Data source is corrupt." });
    }
    
    console.log(`[API /api/local-items] Successfully returned ${items.length} local items`);
    res.status(200).json(items);
    
  } catch (error) {
    console.error('[API /api/local-items] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      message: `Server error: ${errorMessage}`,
      code: 'DATA_READ_ERROR'
    });
  }
});

// --- API Endpoint: Fetch items from External API (Foursquare) ---
app.get('/api/external/items', async (req: Request, res: Response) => {
  console.log('[API /api/external/items] Processing external items request with query params:', req.query);
  
  // Extract query parameters
  const {
    location,
    term,
    latitude,
    longitude,
    limit,
    offset,
    categories,
  } = req.query;

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

  // Parse and validate limit with enhanced bounds checking
  const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
  if (parsedLimit < 1 || parsedLimit > 50) {
    console.warn('[API /api/external/items] Limit out of bounds:', parsedLimit);
    return res.status(400).json({
      message: 'Limit must be between 1 and 50.',
      code: 'LIMIT_OUT_OF_BOUNDS'
    });
  }

  // Parse and validate offset
  const parsedOffset = offset ? parseInt(offset as string, 10) : 0;
  if (parsedOffset < 0) {
    console.warn('[API /api/external/items] Negative offset provided:', parsedOffset);
    return res.status(400).json({
      message: 'Offset must be non-negative.',
      code: 'NEGATIVE_OFFSET'
    });
  }

  // Initialize search parameters - handle required 'near' property
  let searchParams: FoursquareSearchParams;
  
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
    
    // Create search params with coordinates
    searchParams = {
      near: `${parsedLat},${parsedLon}`, // Use coordinates as 'near' parameter
      limit: parsedLimit
    };
    
    // Add ll property if it exists in the interface
    if ('ll' in ({} as FoursquareSearchParams)) {
      (searchParams as any).ll = `${parsedLat},${parsedLon}`;
    }
    
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
    
    // Create search params with location
    searchParams = {
      near: trimmedLocation,
      limit: parsedLimit
    };
    
    console.log(`[API /api/external/items] Using location: ${trimmedLocation}`);
  } else {
    // This should never happen due to earlier validation
    console.error('[API /api/external/items] No valid location parameters found');
    return res.status(400).json({
      message: 'Location validation failed.',
      code: 'LOCATION_VALIDATION_ERROR'
    });
  }

  // Add optional parameters
  if (term) {
    const trimmedTerm = (term as string).trim();
    if (trimmedTerm.length === 0) {
      console.warn('[API /api/external/items] Empty term parameter provided');
      return res.status(400).json({
        message: 'Term parameter cannot be empty.',
        code: 'EMPTY_TERM'
      });
    }
    searchParams.query = trimmedTerm;
  }
  
  if (categories) {
    const trimmedCategories = (categories as string).trim();
    if (trimmedCategories.length === 0) {
      console.warn('[API /api/external/items] Empty categories parameter provided');
      return res.status(400).json({
        message: 'Categories parameter cannot be empty.',
        code: 'EMPTY_CATEGORIES'
      });
    }
    searchParams.categories = trimmedCategories;
  }

  // Handle offset if supported by the interface
  if (parsedOffset > 0) {
    // Check if offset exists in the interface by trying to access it
    try {
      (searchParams as any).offset = parsedOffset;
    } catch (error) {
      console.warn('[API /api/external/items] Offset parameter not supported by Foursquare interface');
    }
  }

  try {
    console.log('[API /api/external/items] Calling Foursquare service with validated params:', searchParams);
    const foursquareApiResponse = await searchFoursquare(searchParams);

    if (!foursquareApiResponse || !foursquareApiResponse.results) {
      console.error('[API /api/external/items] Invalid response from Foursquare service');
      return res.status(502).json({
        message: 'Invalid response from external service.',
        code: 'INVALID_EXTERNAL_RESPONSE',
        source: 'foursquare'
      });
    }

    const localItems: LocalItem[] = transformFoursquareResponseToLocalItems(foursquareApiResponse);
    
    console.log(`[API /api/external/items] Successfully transformed ${localItems.length} items from Foursquare response`);
    
    res.status(200).json({
      items: localItems,
      totalResultsFromSource: foursquareApiResponse.results.length,
      source: 'foursquare',
      requestParams: {
        limit: searchParams.limit,
        offset: parsedOffset,
      }
    });

  } catch (error) {
    console.error('[API /api/external/items] Error occurred:', error);

    if (error instanceof Error) {
      // Handle Foursquare API errors
      if (error.message.startsWith('Foursquare API request failed')) {
        console.error('[API /api/external/items] Foursquare API error detected');
        
        try {
          const statusMatch = error.message.match(/status (\d+)/);
          const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 502;

          const jsonStartIndex = error.message.indexOf('{');
          if (jsonStartIndex !== -1) {
            const jsonErrorString = error.message.substring(jsonStartIndex);
            const foursquareErrorDetails = JSON.parse(jsonErrorString) as FoursquareErrorResponse;

            console.error('[API /api/external/items] Parsed Foursquare error details:', foursquareErrorDetails);

            return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 502).json({
              message: `External API error: ${foursquareErrorDetails.message || 'Details unavailable'}`,
              code: 'EXTERNAL_API_ERROR',
              source: 'foursquare',
              details: foursquareErrorDetails,
            });
          }
        } catch (parseError) {
          console.error('[API /api/external/items] Failed to parse Foursquare error details:', parseError);
          return res.status(502).json({
            message: 'Error communicating with external service. Could not parse error details.',
            code: 'EXTERNAL_API_PARSE_ERROR',
            source: 'foursquare',
            rawError: error.message
          });
        }
      }
      
      // Handle network errors
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        console.error('[API /api/external/items] Network connectivity error');
        return res.status(503).json({
          message: 'External service temporarily unavailable. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          source: 'foursquare'
        });
      }
    }

    // Generic error fallback
    console.error('[API /api/external/items] Unhandled error, returning generic server error');
    res.status(500).json({
      message: 'Failed to fetch external items due to an internal server error.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// --- Development Test Route ---
app.get('/api/test-foursquare', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[API /api/test-foursquare] Unauthorized access attempt in non-development environment');
    return res.status(403).json({
      message: 'Forbidden in this environment',
      code: 'ENVIRONMENT_RESTRICTED'
    });
  }
  
  console.log('[API /api/test-foursquare] Test endpoint accessed with query:', req.query);
  
  try {
    const params: FoursquareSearchParams = {
      near: sanitizeString(req.query.location as string) || 'San Francisco',
      limit: 3,
    };
    
    // Add query parameter if provided
    const queryTerm = sanitizeString(req.query.term as string);
    if (queryTerm) {
      params.query = queryTerm;
    } else {
      params.query = 'restaurants';
    }
    
    console.log('[API /api/test-foursquare] Calling Foursquare service with test params:', params);
    const foursquareData = await searchFoursquare(params);
    console.log('[API /api/test-foursquare] Successfully retrieved test data');
    
    res.status(200).json({
      message: 'Test successful',
      data: foursquareData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[API /api/test-foursquare] Test endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      message: 'Failed to fetch data from Foursquare (test route)',
      code: 'TEST_ENDPOINT_ERROR',
      error: errorMessage
    });
  }
});

// --- 404 Handler ---
app.use('*', (req: Request, res: Response) => {
  console.log(`[API] 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

export default app;