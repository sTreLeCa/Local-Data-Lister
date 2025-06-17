// backend/src/server.ts
import express, { Request, Response, NextFunction } from 'express'; // Added NextFunction for potential future use
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';

import { LocalItem } from '@local-data/types';
import { searchYelp, YelpSearchParameters, YelpErrorResponse } from './services/yelpService'; // Added YelpErrorResponse
import { transformYelpResponseToLocalItems } from './services/dataTransformer';

const app = express();

// Middleware
app.use(cors()); // Enable All CORS Requests
app.use(express.json()); // Middleware to parse JSON bodies

// --- Health Check / Root Route ---
app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

// --- API Endpoint for Local JSON Data ---
app.get('/api/local-items', async (req: Request, res: Response) => {
  try {
    const filePath = path.join(__dirname, 'data', 'local-items.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    // Basic check for empty file content that would cause JSON.parse to error
    if (!fileContent.trim()) {
        console.error('Local items data file is empty.');
        return res.status(500).json({ message: 'Error fetching local items: data source is empty.' });
    }
    const items: LocalItem[] = JSON.parse(fileContent);
    res.status(200).json(items);
  } catch (error) {
    console.error('Failed to read or parse local items data:', error);
    res.status(500).json({ message: 'Error fetching local items data.' });
  }
});

// --- NEW API ENDPOINT: Fetch items from External API (Yelp) ---
app.get('/api/external/items', async (req: Request, res: Response) => {
  // 1. Extract and validate query parameters
  const {
    location,       // string: e.g., "New York", "NYC", "SoHo, New York"
    term,           // string: e.g., "restaurants", "parks", "coffee"
    latitude,       // string (parsed to number): e.g., "40.7128"
    longitude,      // string (parsed to number): e.g., "-74.0060"
    limit,          // string (parsed to number): e.g., "10" (default 20, max 50)
    offset,         // string (parsed to number): e.g., "0" (for pagination)
    categories,     // string: comma-separated Yelp category aliases, e.g., "restaurants,bars"
    // Other Yelp params like sortBy, price, openNow can be added here
  } = req.query;

  // Validate that either location or geographical coordinates are provided
  if (!location && (!latitude || !longitude)) {
    return res.status(400).json({
      message: 'Missing required query parameters: either "location" (string) or both "latitude" and "longitude" (numbers) must be provided.',
    });
  }

  // Construct search parameters for the Yelp service
  const searchParams: YelpSearchParameters = {};

  if (term) searchParams.term = term as string;
  if (categories) searchParams.categories = categories as string;

  // Parse limit and offset, providing defaults if necessary
  const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
  searchParams.limit = Math.min(Math.max(1, parsedLimit), 50); // Clamp between 1 and 50

  if (offset) {
    const parsedOffset = parseInt(offset as string, 10);
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      searchParams.offset = parsedOffset;
    }
  }
  
  // Prefer latitude/longitude if provided and valid, otherwise use location string
  if (latitude && longitude) {
    const parsedLat = parseFloat(latitude as string);
    const parsedLon = parseFloat(longitude as string);
    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      searchParams.latitude = parsedLat;
      searchParams.longitude = parsedLon;
    } else if (location) { // Fallback to location string if lat/lon are invalid
        searchParams.location = location as string;
    } else { // If lat/lon are invalid AND no location string, it's an error (covered by initial check)
        return res.status(400).json({ message: 'Invalid latitude/longitude provided without a fallback location string.' });
    }
  } else if (location) {
    searchParams.location = location as string;
  }

  try {
    // 2. Call the external API service (yelpService)
    console.log(`[API /api/external/items] Calling Yelp service with params:`, searchParams);
    const yelpApiResponse = await searchYelp(searchParams);

    // 3. Transform the raw API response into our LocalItem[] format
    const localItems: LocalItem[] = transformYelpResponseToLocalItems(yelpApiResponse);
    
    // 4. Respond with the transformed items (and total from Yelp for context, if desired)
    // The task specified { items: LocalItem[] }
    // Sending yelpApiResponse.total can be useful for frontend pagination.
    res.status(200).json({
      items: localItems,
      totalResultsFromSource: yelpApiResponse.total, // Optional: provides context on how many items Yelp found
      source: 'live', // This will be relevant when caching is added (A-Adv-Task 4 -> B-Adv-Task 2)
    });

  } catch (error) {
    // 5. Enhanced error handling
    console.error('[API /api/external/items] Error:', error);

    if (error instanceof Error) {
        // Attempt to provide more specific feedback if it's a known Yelp API error structure
        // This assumes yelpService might throw an error whose message contains Yelp's JSON error
        // Or that yelpService might throw a custom error object with a 'yelpError' property.
        // For simplicity here, we'll check the message.
        if (error.message.startsWith('Yelp API request failed')) {
            // Example: "Yelp API request failed with status 400: {"error": {"code": "VALIDATION_ERROR", "description": "blah"}}"
            try {
                // Extract the status code if present in the message
                const statusMatch = error.message.match(/status (\d+)/);
                const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 502; // Default to 502 Bad Gateway

                // Extract the JSON part
                const jsonErrorString = error.message.substring(error.message.indexOf('{'));
                const yelpErrorDetails = JSON.parse(jsonErrorString) as YelpErrorResponse; // Type assertion

                return res.status(statusCode).json({
                    message: `Error from external API (Yelp): ${yelpErrorDetails.error?.description || 'Details unavailable'}`,
                    code: yelpErrorDetails.error?.code,
                    details: yelpErrorDetails, // Send the full Yelp error object for detailed client-side handling if needed
                });
            } catch (parseError) {
                // If parsing the Yelp error from the message fails
                return res.status(502).json({ message: 'Error communicating with external service (Yelp). Could not parse error details.', rawError: error.message });
            }
        }
    }
    // Generic internal server error
    res.status(500).json({ message: 'Failed to fetch external items due to an internal server error.' });
  }
});


// --- TEMPORARY TEST ROUTE for Yelp Service - Consider removing after development ---
// Or protect it, e.g., by checking for a specific environment or a secret query param
app.get('/api/test-yelp', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') { // Simple protection
    return res.status(403).send('Forbidden in this environment');
  }
  try {
    const params: YelpSearchParameters = {
      location: (req.query.location as string) || 'San Francisco',
      term: (req.query.term as string) || 'restaurants',
      limit: 3, // Keep it small for testing
    };
    console.log(`[API /api/test-yelp] Calling Yelp service with params:`, params);
    const yelpData = await searchYelp(params);
    res.json(yelpData); // Returns raw Yelp data
  } catch (error) {
    console.error('Error in /api/test-yelp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch data from Yelp (test route)', error: errorMessage });
  }
});

export default app;