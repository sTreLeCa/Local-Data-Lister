// frontend/src/services/localItemService.ts
import type { LocalItem } from '@local-data/types'; // იმპორტი გაზიარებული ტიპებიდან

/**
 * Fetches the list of local items from the backend API.
 * @returns A promise that resolves to an array of LocalItem objects.
 * @throws An error if the network response is not ok or if parsing fails.
 */
export const fetchLocalItems = async (): Promise<LocalItem[]> => {
  // Vite dev server-ის proxy ამ მოთხოვნას გადაამისამართებს
  // შენს ბექენდ სერვერზე (მაგ., http://localhost:4000/api/local-items)
  const response = await fetch('/api/local-items');

  if (!response.ok) {
    // თუ სერვერმა შეცდომა დააბრუნა (მაგ., 4xx ან 5xx სტატუს კოდი)
    let errorMessage = `API Error: ${response.status} - ${response.statusText}`;
    try {
      // შევეცადოთ, წავიკითხოთ შეცდომის JSON პასუხი, თუ ბექენდი აბრუნებს მას
      const errorData = await response.json();
      if (errorData && errorData.message) { // ვამოწმებთ, რომ ბექენდის message ველი არსებობს
        errorMessage = errorData.message;
      }
    } catch (e) {
      // თუ JSON-ის წაკითხვა ვერ მოხერხდა, გამოვიყენოთ სტანდარტული შეტყობინება
      console.error('Failed to parse error response JSON from API:', e);
    }
    throw new Error(errorMessage);
  }

  // თუ პასუხი წარმატებულია (2xx სტატუს კოდი)
  // შენი backend/server.ts პირდაპირ აბრუნებს LocalItem[] მასივს,
  // და არა ობიექტს { localItems: [] } ფორმატით.
  // ამიტომ, პირდაპირ ვპარსავთ მასივად.
  const data: LocalItem[] = await response.json();
  return data;
};

export const fetchExternalItems = async (params: { location?: string; query?: string }): Promise<LocalItem[]> => {
  console.log(`%c[MOCK] Fetching EXTERNAL items with params:`, 'color: orange', params);
  
  // This is your temporary "fake" backend.
  // It returns a promise, just like a real fetch call.
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create some realistic mock data that is DIFFERENT from your local-items.json
      const mockExternalData: LocalItem[] = [
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
          id: "yelp-2",
          name: "API Park Adventure",
          type: "park",
          description: "A virtual park with zero bugs.",
          location: { city: params.location || 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
          parkType: "National Park",
          amenities: ["virtual trees", "pixelated benches"]
        }
      ];
      console.log(`%c[MOCK] Responding with:`, 'color: orange', mockExternalData);
      resolve(mockExternalData);
    }, 1200); // Simulate a slightly longer network delay
  });
};