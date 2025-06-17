// backend/src/services/yelpService.ts
import axios from 'axios';

// Type for the search parameters our service will accept
export interface YelpSearchParameters {
  term?: string;         // e.g., "restaurants", "parks"
  location?: string;     // e.g., "San Francisco", "NYC"
  latitude?: number;
  longitude?: number;
  limit?: number;        // Number of results to return (max 50)
  offset?: number;       // For pagination
  categories?: string;   // e.g., "restaurants,bars" or "parks"
  // Add other parameters as needed from Yelp API docs
}

// A more specific type for the raw Yelp API business object (can be expanded)
// You can find more details in the Yelp API documentation for business search response
export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  image_url: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: { alias: string; title: string }[];
  rating: number;
  coordinates: { latitude: number; longitude: number };
  transactions: string[];
  price?: string; // e.g., "$", "$$", "$$$"
  location: {
    address1: string | null;
    address2: string | null;
    address3: string | null;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance?: number; // Distance in meters from search location
}

// Type for the raw Yelp API search response
export interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: {
      longitude: number;
      latitude: number;
    };
  };
}

const YELP_API_BASE_URL = 'https://api.yelp.com/v3';
const apiKey = process.env.YELP_API_KEY;

if (!apiKey) {
  console.error('FATAL ERROR: Yelp API Key is not configured in environment variables.');
  // Optionally, throw an error to prevent the service from being used incorrectly
  // throw new Error('Yelp API Key is not configured.');
}

// Create an Axios instance pre-configured for Yelp API
const yelpApiClient = axios.create({
  baseURL: YELP_API_BASE_URL,
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Searches the Yelp API for businesses.
 * @param params - Search parameters (term, location, lat/lon, etc.)
 * @returns A promise that resolves to the raw Yelp API search response.
 */
export const searchYelp = async (params: YelpSearchParameters): Promise<YelpSearchResponse> => {
  if (!apiKey) {
    // Handle case where API key might still be missing at runtime,
    // though the check above should catch it on module load if critical.
    throw new Error('Yelp API service is not available due to missing API key.');
  }

  try {
    const response = await yelpApiClient.get<YelpSearchResponse>('/businesses/search', {
      params: {
        ...params,
        limit: params.limit || 20, // Default to 20 results if not specified
      },
    });
    return response.data; // This is the raw API response
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Error calling Yelp API:', error.response.status, error.response.data);
      throw new Error(`Yelp API request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Yelp API:', error.request);
      throw new Error('No response received from Yelp API');
    } else {
      // Something happened in setting up the request
      console.error('An unexpected error occurred while calling Yelp API:', error.message);
      throw new Error('An unexpected error occurred while contacting Yelp.');
    }
  }
};

// Example of how to manually test this service (optional, can be done in a route handler later)
/*
const testYelpSearch = async () => {
  console.log("Testing Yelp Search Service...");
  try {
    const results = await searchYelp({ location: 'New York City', term: 'pizza', limit: 3 });
    console.log("Yelp API Response (first business):", results.businesses[0]);
    console.log("Total results:", results.total);
  } catch (err) {
    console.error("Error during Yelp service test:", err);
  }
};

// Uncomment to run the test when this file is directly executed (e.g., `ts-node backend/src/services/yelpService.ts`)
// if (require.main === module) {
//   testYelpSearch();
// }
*/