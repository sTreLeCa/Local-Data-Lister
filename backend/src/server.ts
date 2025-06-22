// backend/src/server.ts

// --- Core Node.js and Express Imports ---
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';

// --- Shared Types and Services ---
import { LocalItem } from '@local-data/types';
import { searchFoursquare, FoursquareSearchParams, FoursquareErrorResponse } from './services/foursquareService';
import { transformFoursquareResponseToLocalItems } from './services/dataTransformer';
import * as cacheService from './services/cacheService';

// --- Route Handlers ---
import authRoutes from './routes/auth';
import favoritesRoutes from './routes/favorites';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(cors());
app.use(express.json());

// --- Utility Functions for Validation ---
const isValidNumber = (value: string | undefined): boolean => {
  if (!value) return false;
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
};

const isValidInteger = (value: string | undefined): boolean => {
  if (!value) return false;
  const num = parseFloat(value);
  return Number.isInteger(num);
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
    if (!Array.isArray(items)) {
      console.error("CRITICAL BACKEND ERROR: local-items.json did not parse to an array. Parsed value:", items);
      return res.status(500).json({ message: "Data source is corrupt.", code: 'INVALID_DATA_FORMAT' });
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

// --- API Endpoint: Fetch items from External API (Foursquare) WITH CACHING ---
app.get('/api/external/items', async (req: Request, res: Response) => {
  console.log('[API /api/external/items] Processing external items request with query params:', req.query);

  const queryParamsForCache: Record<string, string | number | undefined> = {};
  for (const key in req.query) {
    if (Object.prototype.hasOwnProperty.call(req.query, key)) {
      const value = req.query[key];
      if (typeof value === 'string' || typeof value === 'number') {
        queryParamsForCache[key] = value;
      } else if (Array.isArray(value)) {
        queryParamsForCache[key] = value.join(',');
      }
    }
  }
  const cacheKey = cacheService.generateApiCacheKey('external-items', queryParamsForCache);

  type CachedExternalResponse = {
    items: LocalItem[];
    totalResultsFromSource: number;
    sourceApi: string;
    requestParams: { limit: number; offset: number };
  };
  const cachedData = cacheService.get<CachedExternalResponse>(cacheKey);

  if (cachedData) {
    console.log(`[API /api/external/items] Cache HIT for key: ${cacheKey}`);
    return res.status(200).json({
      ...cachedData,
      source: 'cache',
    });
  }

  console.log(`[API /api/external/items] Cache MISS for key: ${cacheKey}. Fetching from Foursquare.`);

  const { location, term, latitude, longitude, limit, offset, categories } = req.query;

  if (!location && (!latitude || !longitude)) {
    return res.status(400).json({ message: 'Missing required query parameters: either "location" (string) or both "latitude" and "longitude" (numbers) must be provided.', code: 'MISSING_LOCATION_PARAMS'});
  }
  if ((latitude || longitude) && (!isValidNumber(latitude as string) || !isValidNumber(longitude as string))) {
    return res.status(400).json({ message: 'Invalid latitude/longitude format. Both must be valid numbers.', code: 'INVALID_COORDINATES'});
  }

  const parsedLimitInput = limit as string | undefined;
  if (limit && !isValidInteger(parsedLimitInput)) {
    return res.status(400).json({ message: 'Invalid limit parameter. Must be an integer.', code: 'INVALID_LIMIT'});
  }
  const parsedLimit = limit ? parseInt(parsedLimitInput as string, 10) : 20;
  if (parsedLimit < 1 || parsedLimit > 50) {
    return res.status(400).json({ message: 'Limit must be between 1 and 50.', code: 'LIMIT_OUT_OF_BOUNDS'});
  }

  const parsedOffsetInput = offset as string | undefined;
  if (offset && !isValidInteger(parsedOffsetInput)) {
    return res.status(400).json({ message: 'Invalid offset parameter. Must be an integer.', code: 'INVALID_OFFSET'});
  }
  const parsedOffset = offset ? parseInt(parsedOffsetInput as string, 10) : 0;
  if (parsedOffset < 0) {
    return res.status(400).json({ message: 'Offset must be non-negative.', code: 'NEGATIVE_OFFSET'});
  }

  let searchParams: FoursquareSearchParams;
  if (latitude && longitude) {
    const parsedLat = parseFloat(latitude as string);
    const parsedLon = parseFloat(longitude as string);
    if (parsedLat < -90 || parsedLat > 90) {
        return res.status(400).json({ message: 'Latitude must be between -90 and 90 degrees.', code: 'INVALID_LATITUDE_RANGE'});
    }
    if (parsedLon < -180 || parsedLon > 180) {
        return res.status(400).json({ message: 'Longitude must be between -180 and 180 degrees.', code: 'INVALID_LONGITUDE_RANGE'});
    }
    searchParams = { near: `${parsedLat},${parsedLon}`, limit: parsedLimit };
    console.log(`[API /api/external/items] Using coordinates: lat=${parsedLat}, lon=${parsedLon}`);
  } else if (location && typeof location === 'string') {
    const trimmedLocation = location.trim();
    if (trimmedLocation.length === 0) {
        return res.status(400).json({ message: 'Location parameter cannot be empty.', code: 'EMPTY_LOCATION'});
    }
    searchParams = { near: trimmedLocation, limit: parsedLimit };
    console.log(`[API /api/external/items] Using location: ${trimmedLocation}`);
  } else {
    return res.status(400).json({ message: 'Location validation failed (should not happen due to prior checks).', code: 'LOCATION_VALIDATION_ERROR'});
  }

  if (term && typeof term === 'string') {
    const trimmedTerm = term.trim();
    if(trimmedTerm.length === 0) return res.status(400).json({message: 'Term parameter cannot be empty.', code: 'EMPTY_TERM'});
    searchParams.query = trimmedTerm;
  }
  if (categories && typeof categories === 'string') {
    const trimmedCategories = categories.trim();
    if(trimmedCategories.length === 0) return res.status(400).json({message: 'Categories parameter cannot be empty.', code: 'EMPTY_CATEGORIES'});
    searchParams.categories = trimmedCategories;
  }

  try {
    console.log('[API /api/external/items] Calling Foursquare service with validated params:', searchParams);
    const foursquareApiResponse = await searchFoursquare(searchParams);

    if (!foursquareApiResponse || !foursquareApiResponse.results) {
      console.error('[API /api/external/items] Invalid response from Foursquare service');
      return res.status(502).json({ message: 'Invalid response from external service.', code: 'INVALID_EXTERNAL_RESPONSE', source: 'foursquare' });
    }

    const transformedItems: LocalItem[] = transformFoursquareResponseToLocalItems(foursquareApiResponse);
    const responseDataToCache: CachedExternalResponse = {
      items: transformedItems,
      totalResultsFromSource: foursquareApiResponse.results.length,
      sourceApi: 'foursquare',
      requestParams: { limit: parsedLimit, offset: parsedOffset }
    };

    cacheService.set(cacheKey, responseDataToCache, 3600);
    return res.status(200).json({ ...responseDataToCache, source: 'foursquare' });

  } catch (error) {
    console.error('[API /api/external/items] Error occurred during Foursquare call or transformation:', error);
    let statusCode = 502;
    let errorCode = 'EXTERNAL_SERVICE_ERROR';
    let errorMessage = 'An unexpected error occurred while contacting the external service.';
    let errorDetails: any;
    const errorSource: string | undefined = 'foursquare';

    if (error instanceof Error) {
        if (error.message.startsWith('Foursquare API request failed')) {
            errorCode = 'EXTERNAL_API_ERROR';
            const statusMatch = error.message.match(/status (\d+)/);
            if (statusMatch) statusCode = parseInt(statusMatch[1], 10);
            if (statusCode < 400 || statusCode > 599) statusCode = 502;

            const jsonStartIndex = error.message.indexOf('{');
            if (jsonStartIndex !== -1) {
                try {
                    const parsedDetails = JSON.parse(error.message.substring(jsonStartIndex)) as FoursquareErrorResponse;
                    errorMessage = `External API error: ${parsedDetails.message || 'Details unavailable'}`;
                    errorDetails = parsedDetails;
                } catch (e) { errorMessage = error.message; }
            } else {
                errorMessage = error.message;
            }
        } else {
            // ეს არის ზოგადი შეცდომა, მაგ. 'Foursquare is down'
            // აქ ვქმნით უფრო აღწერით შეტყობინებას
            errorMessage = `Error communicating with Foursquare: ${error.message}`;
        }
    }
    return res.status(statusCode).json({ message: errorMessage, code: errorCode, source: errorSource, details: errorDetails });
  }
});

// --- NEW API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/me/favorites', favoritesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Development Test Route ---
if (process.env.NODE_ENV === 'development') {
  app.get('/api/test-foursquare', async (req: Request, res: Response) => {
    try {
      const params: FoursquareSearchParams = {
        near: (req.query.location as string)?.trim() || 'San Francisco',
        limit: 3,
        query: (req.query.term as string)?.trim() || 'restaurants'
      };
      const foursquareData = await searchFoursquare(params);
      res.status(200).json({ message: 'Test successful', data: foursquareData });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Failed to fetch test data from Foursquare', error: errorMessage });
    }
  });
}

// --- 404 Handler ---
app.use('*', (req: Request, res: Response) => {
  console.log(`[API] 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

// --- General Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[FATAL ERROR]', err.stack);
    res.status(500).json({
      message: 'An unexpected internal server error occurred.',
      code: 'INTERNAL_SERVER_ERROR'
    });
});

export default app;