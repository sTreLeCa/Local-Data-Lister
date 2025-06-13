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