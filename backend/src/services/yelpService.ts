// backend/src/services/yelpService.ts
import axios from 'axios';

/**
 * Represents a Yelp business category.
 */
export interface YelpCategory { 
  /** The category alias */
  alias: string; 
  /** The human-readable category title */
  title: string 
};

/**
 * Describes the structure of an error object from the Yelp API.
 */
export interface YelpError {
  /** Error code identifying the type of error */
  code: string;
  /** Human-readable description of the error */
  description: string;
  /** Optional field name that caused the error */
  field?: string;
  /** Optional instance identifier for the error */
  instance?: string;
}

/**
 * Describes the structure of the error response from the Yelp API.
 */
export interface YelpErrorResponse {
  /** The error object containing details about the failure */
  error: YelpError;
}

/**
 * Represents the parameters for searching the Yelp API.
 */
export interface YelpSearchParameters {
  /** Search term, e.g., "restaurants", "parks" */
  term?: string;
  /** Location string, e.g., "San Francisco", "NYC" */
  location?: string;
  /** Latitude coordinate for location-based search */
  latitude?: number;
  /** Longitude coordinate for location-based search */
  longitude?: number;
  /** Number of results to return (maximum 50) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Comma-separated category aliases, e.g., "restaurants,bars" or "parks" */
  categories?: string;
  // Add other parameters as needed from Yelp API docs
}

/**
 * Describes the structure of a business object from the Yelp API.
 * Contains comprehensive information about each business returned in search results.
 */
export interface YelpBusiness {
  /** Unique identifier for the business */
  id: string;
  /** Business alias used in Yelp URLs */
  alias: string;
  /** Business name */
  name: string;
  /** URL to the business's main image, may be null */
  image_url: string | null;
  /** Whether the business is permanently closed */
  is_closed: boolean;
  /** URL to the business's Yelp page, may be null */
  url: string | null;
  /** Total number of reviews for the business, may be null */
  review_count: number | null;
  /** Array of category objects the business belongs to */
  categories: { alias: string; title: string }[] | undefined;
  /** Average rating of the business (1-5 stars), may be null */
  rating: number | null;
  /** Geographic coordinates of the business */
  coordinates: { latitude: number; longitude: number };
  /** Types of transactions the business accepts (e.g., "pickup", "delivery") */
  transactions: string[];
  /** Price tier indicator (e.g., "$", "$", "$$", "$$") */
  price?: string;
  /** Business location information */
  location: {
    /** Primary street address, may be null */
    address1: string | null;
    /** Secondary address line, may be null */
    address2: string | null;
    /** Tertiary address line, may be null */
    address3: string | null;
    /** City name, may be null */
    city: string | null;
    /** ZIP/postal code, may be null */
    zip_code: string | null;
    /** Country name, may be null */
    country: string | null;
    /** State/province name, may be null */
    state: string | null;
    /** Array of formatted address lines for display */
    display_address: string[];
  };
  /** Business phone number, may be null */
  phone: string | null;
  /** Formatted phone number for display, may be null */
  display_phone: string | null;
  /** Distance from search coordinates in meters (only present when using lat/lng search) */
  distance?: number;
}

/**
 * Describes the structure of the complete search response from the Yelp API.
 */
export interface YelpSearchResponse {
  /** Array of business objects matching the search criteria */
  businesses: YelpBusiness[];
  /** Total number of businesses available (may be greater than the number returned) */
  total: number;
  /** Geographic region information for the search */
  region: {
    /** Center point of the search region */
    center: {
      /** Longitude of the center point */
      longitude: number;
      /** Latitude of the center point */
      latitude: number;
    };
  };
}

const YELP_API_BASE_URL = 'https://api.yelp.com/v3';
const yelpApiKey = process.env.YELP_API_KEY;

// Validate API key on module load
if (!yelpApiKey) {
  console.error('FATAL ERROR: YELP_API_KEY environment variable is not configured.');
  console.error('Please set the YELP_API_KEY environment variable with your Yelp API key.');
}

// Create an Axios instance pre-configured for Yelp API
const yelpApiClient = axios.create({
  baseURL: YELP_API_BASE_URL,
  headers: {
    Authorization: `Bearer ${yelpApiKey}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Searches the Yelp API for businesses based on the provided parameters.
 * 
 * @param searchParams - The search parameters including location, term, coordinates, etc.
 * @returns A promise that resolves to the complete Yelp API search response
 * @throws {Error} If the API key is not configured
 * @throws {Error} If the Yelp API request fails due to network issues or API errors
 * @throws {Error} If no response is received from the Yelp API
 * 
 * @example
 * ```typescript
 * const results = await searchYelp({
 *   location: 'San Francisco, CA',
 *   term: 'pizza',
 *   limit: 10
 * });
 * console.log(`Found ${results.total} businesses`);
 * ```
 */
export const searchYelp = async (searchParams: YelpSearchParameters): Promise<YelpSearchResponse> => {
  // Validate API key before making request
  if (!yelpApiKey) {
    throw new Error('Yelp API service is not available: YELP_API_KEY environment variable is not configured.');
  }

  try {
    const response = await yelpApiClient.get<YelpSearchResponse>('/businesses/search', {
      params: {
        ...searchParams,
        limit: searchParams.limit || 20, // Default to 20 results if not specified
      },
    });
    
    return response.data;
  } catch (error: any) {
    // Handle Axios errors with response from server
    if (axios.isAxiosError(error) && error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      console.error(`Yelp API error - Status: ${statusCode}`, errorData);
      
      // Provide detailed error message including status and response data
      throw new Error(
        `Yelp API request failed with status ${statusCode}: ${JSON.stringify(errorData)}`
      );
    }
    
    // Handle network errors (no response received)
    if (axios.isAxiosError(error) && error.request) {
      console.error('Network error - No response received from Yelp API:', error.message);
      throw new Error('No response received from Yelp API - please check your network connection');
    }
    
    // Handle other unexpected errors
    console.error('Unexpected error while calling Yelp API:', error.message);
    throw new Error(`An unexpected error occurred while contacting Yelp API: ${error.message}`);
  }
};

/**
 * Example function to test the Yelp search service.
 * Uncomment the call at the bottom to run when this file is executed directly.
 * 
 * @example
 * ```bash
 * # Run the test with ts-node
 * ts-node backend/src/services/yelpService.ts
 * ```
 */
const testYelpSearch = async (): Promise<void> => {
  console.log("Testing Yelp Search Service...");
  try {
    const searchResults = await searchYelp({ 
      location: 'New York City', 
      term: 'pizza', 
      limit: 3 
    });
    
    console.log("Yelp API Response (first business):", searchResults.businesses[0]);
    console.log("Total results available:", searchResults.total);
    console.log("Number of businesses returned:", searchResults.businesses.length);
  } catch (error) {
    console.error("Error during Yelp service test:", error);
  }
};

// Uncomment to run the test when this file is directly executed
// if (require.main === module) {
//   testYelpSearch();
// }