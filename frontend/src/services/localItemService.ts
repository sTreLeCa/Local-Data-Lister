import type { LocalItem } from '@local-data/types';

// This function remains unchanged
export const fetchLocalItems = async (): Promise<LocalItem[]> => {
  const response = await fetch('/api/local-items');
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} - ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      console.error('Failed to parse error response JSON from API:', e);
    }
    throw new Error(errorMessage);
  }
  const data: LocalItem[] = await response.json();
  return data;
};


// --- UPDATED, "SMART" MOCK FUNCTION ---
export const fetchExternalItems = async (params: { location?: string; query?: string }): Promise<LocalItem[]> => {
  console.log(`%c[MOCK] Fetching EXTERNAL items with params:`, 'color: orange', params);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // --- NEW LOGIC: Check the query parameter ---
      const query = params.query?.toLowerCase() || '';
      let mockExternalData: LocalItem[] = [];

      if (query.includes('taco') || query.includes('food') || query.includes('mexican')) {
        mockExternalData = [
          {
            id: "yelp-1",
            name: "Yelp's Fiery Tacos",
            type: "restaurant",
            description: "Tacos so good they came from a mock API.",
            location: { city: params.location || 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
            cuisineType: "Mexican",
            rating: 4.8
          },
          {
            id: "yelp-3",
            name: "The Burrito Place",
            type: "restaurant",
            description: "Another great choice for Mexican food.",
            location: { city: params.location || 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
            cuisineType: "Mexican",
            rating: 4.5
          }
        ];
      } else if (query.includes('park') || query.includes('green')) {
        mockExternalData = [
          {
            id: "yelp-2",
            name: "API Park Adventure",
            type: "park",
            description: "A virtual park with zero bugs.",
            location: { city: params.location || 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
            parkType: "National Park",
            amenities: ["virtual trees", "pixelated benches"]
          }
        ];
      } else {
        // If the query doesn't match anything, return an empty array,
        // just like a real API would.
        mockExternalData = [];
      }
      
      console.log(`%c[MOCK] Responding with:`, 'color: orange', mockExternalData);
      resolve(mockExternalData);
    }, 1200);
  });
};