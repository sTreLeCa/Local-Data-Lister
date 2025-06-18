// backend/src/services/foursquareService.ts
import axios from 'axios';

/**
 * Represents a Foursquare place category.
 */
export interface FoursquareCategory {
  /** Unique identifier for the category */
  id: number;
  /** Human-readable category name */
  name: string;
  /** Category icon information */
  icon: {
    /** URL prefix for the icon */
    prefix: string;
    /** URL suffix for the icon */
    suffix: string;
  };
}

/**
 * Represents location information for a Foursquare place.
 */
export interface FoursquareLocation {
  /** Street address, may be undefined */
  address?: string;
  /** Country name */
  country: string;
  /** Cross street information, may be undefined */
  cross_street?: string;
  /** City/locality name, may be undefined */
  locality?: string;
  /** Postal/ZIP code, may be undefined */
  postcode?: string;
  /** State/region name, may be undefined */
  region?: string;
  /** Full formatted address string */
  formatted_address: string;
}

/**
 * Represents geographic coordinates for a Foursquare place.
 */
export interface FoursquareGeocodes {
  /** Main coordinate point */
  main: {
    /** Latitude coordinate */
    latitude: number;
    /** Longitude coordinate */
    longitude: number;
  };
}

/**
 * Represents a photo from Foursquare.
 */
export interface FoursquarePhoto {
  /** Unique photo identifier */
  id: string;
  /** Photo creation timestamp */
  created_at: string;
  /** URL prefix for the photo */
  prefix: string;
  /** URL suffix for the photo */
  suffix: string;
  /** Photo width in pixels */
  width: number;
  /** Photo height in pixels */
  height: number;
}

/**
 * Represents a Foursquare place with comprehensive information.
 */
export interface FoursquarePlace {
  /** Foursquare unique place identifier */
  fsq_id: string;
  /** Array of categories this place belongs to */
  categories: FoursquareCategory[];
  /** Chain information (if applicable) */
  chains: any[];
  /** Distance from search point in meters */
  distance: number;
  /** Geographic coordinates */
  geocodes: FoursquareGeocodes;
  /** Direct link to the place */
  link: string;
  /** Location and address information */
  location: FoursquareLocation;
  /** Place name */
  name: string;
  /** Related places information */
  related_places: object;
  /** Timezone information */
  timezone: string;
  
  // Optional fields that can be requested
  /** Place description, may be undefined */
  description?: string;
  /** Place rating on a scale of 10, may be undefined */
  rating?: number;
  /** Website URL, may be undefined */
  website?: string;
  /** Array of photos, may be undefined */
  photos?: FoursquarePhoto[];
  /** Price tier (1-4 scale: $ to $$$$), may be undefined */
  price?: number;
}

/**
 * Represents the complete search response from the Foursquare API.
 */
export interface FoursquareSearchResponse {
  /** Array of places matching the search criteria */
  results: FoursquarePlace[];
}

/**
 * Represents the parameters for searching the Foursquare API.
 */
export interface FoursquareSearchParams {
  /** Location string, e.g., "New York, NY" */
  near: string;
  /** Search query, e.g., "pizza" or "park" */
  query?: string;
  /** Number of results to return (maximum 50) */
  limit?: number;
  /** Comma-separated list of category IDs */
  categories?: string;
  /** Comma-separated list of fields to return */
  fields?: string;
}

/**
 * Describes the structure of an error response from the Foursquare API.
 */
export interface FoursquareErrorResponse {
  /** Error message from the API */
  message?: string;
  /** Additional error details */
  details?: any;
}

const FOURSQUARE_API_BASE_URL = 'https://api.foursquare.com/v3';
const foursquareApiKey = process.env.FOURSQUARE_API_KEY;

// Validate API key on module load
if (!foursquareApiKey) {
  console.error('FATAL ERROR: FOURSQUARE_API_KEY environment variable is not configured.');
  console.error('Please set the FOURSQUARE_API_KEY environment variable with your Foursquare API key.');
}

// Create an Axios instance pre-configured for Foursquare API
const foursquareApiClient = axios.create({
  baseURL: FOURSQUARE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    Authorization: foursquareApiKey || '',
  },
});

/**
 * Searches the Foursquare API for places based on the provided parameters.
 * 
 * @param searchParams - The search parameters including location, query, categories, etc.
 * @returns A promise that resolves to the complete Foursquare API search response
 * @throws {Error} If the API key is not configured
 * @throws {Error} If the Foursquare API request fails due to network issues or API errors
 * @throws {Error} If no response is received from the Foursquare API
 * 
 * @example
 * ```typescript
 * const results = await searchFoursquare({
 *   near: 'San Francisco, CA',
 *   query: 'pizza',
 *   limit: 10
 * });
 * console.log(`Found ${results.results.length} places`);
 * ```
 */
export const searchFoursquare = async (searchParams: FoursquareSearchParams): Promise<FoursquareSearchResponse> => {
  // Validate API key before making request
  if (!foursquareApiKey) {
    throw new Error('Foursquare API service is not available: FOURSQUARE_API_KEY environment variable is not configured.');
  }

  try {
    const response = await foursquareApiClient.get<FoursquareSearchResponse>('/places/search', {
      params: {
        ...searchParams,
        limit: searchParams.limit || 20, // Default to 20 results if not specified
        // Requesting a rich set of fields for transformation
        fields: searchParams.fields || 'fsq_id,name,geocodes,location,categories,rating,website,photos,price,description',
      },
    });
    
    return response.data;
  } catch (error: any) {
    // Handle Axios errors with response from server
    if (axios.isAxiosError(error) && error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      console.error(`Foursquare API error - Status: ${statusCode}`, errorData);
      
      // Provide detailed error message including status and response data
      throw new Error(
        `Foursquare API request failed with status ${statusCode}: ${JSON.stringify(errorData)}`
      );
    }
    
    // Handle network errors (no response received)
    if (axios.isAxiosError(error) && error.request) {
      console.error('Network error - No response received from Foursquare API:', error.message);
      throw new Error('No response received from Foursquare API - please check your network connection');
    }
    
    // Handle other unexpected errors
    console.error('Unexpected error while calling Foursquare API:', error.message);
    throw new Error(`An unexpected error occurred while contacting Foursquare API: ${error.message}`);
  }
};

/**
 * Example function to test the Foursquare search service.
 * Uncomment the call at the bottom to run when this file is executed directly.
 * 
 * @example
 * ```bash
 * # Run the test with ts-node
 * ts-node backend/src/services/foursquareService.ts
 * ```
 */
const testFoursquareSearch = async (): Promise<void> => {
  console.log("Testing Foursquare Search Service...");
  try {
    const searchResults = await searchFoursquare({ 
      near: 'New York City, NY', 
      query: 'pizza', 
      limit: 3 
    });
    
    console.log("Foursquare API Response (first place):", searchResults.results[0]);
    console.log("Number of places returned:", searchResults.results.length);
  } catch (error) {
    console.error("Error during Foursquare service test:", error);
  }
};

// Uncomment to run the test when this file is directly executed
// if (require.main === module) {
//   testFoursquareSearch();
// }