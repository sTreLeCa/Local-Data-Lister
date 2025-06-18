import type { LocalItem } from '@local-data/types';

// This function is updated to include debug logs
export const fetchLocalItems = async (): Promise<LocalItem[]> => {
  console.log('[DEBUG] 1. Calling fetchLocalItems...');
  const response = await fetch('/api/local-items');

  if (!response.ok) {
    console.error('[DEBUG] 2. fetchLocalItems FAILED response:', response);
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

  // --- ADDED DEBUG LOG ---
  console.log('[DEBUG] 2. Received data in fetchLocalItems:', data);

  if (!Array.isArray(data)) {
    console.error('[DEBUG] CRITICAL: Data received from /api/local-items is NOT an array!');
  }

  return data;
};

// --- UPDATED MOCK FUNCTION ---
export const fetchExternalItems = async (params: { location?: string; query?: string }): Promise<LocalItem[]> => {
  console.log(`%c[MOCK] Fetching EXTERNAL items with params:`, 'color: orange', params);

  return new Promise((resolve) => {
    setTimeout(() => {
      const query = params.query?.toLowerCase() || '';
      let mockExternalData: LocalItem[] = [];

      if (query.includes('taco') || query.includes('food') || query.includes('mexican')) {
        mockExternalData = [
          {
            id: "yelp-1",
            name: "Yelp's Fiery Tacos",
            type: "Restaurant",
            description: "Tacos so good they came from a mock API.",
            location: { city: params.location || 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
            cuisineType: "Mexican",
            rating: 4.8
          },
          {
            id: "yelp-3",
            name: "The Burrito Place",
            type: "Restaurant",
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
            type: "Park",
            description: "A virtual park with zero bugs.",
            location: { city: params.location || 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
            parkType: "National Park",
            amenities: ["virtual trees", "pixelated benches"]
          }
        ];
      } else {
        mockExternalData = [];
      }

      console.log(`%c[MOCK] Responding with:`, 'color: orange', mockExternalData);
      resolve(mockExternalData);
    }, 1200);
  });
};
