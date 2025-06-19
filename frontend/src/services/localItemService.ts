import type { LocalItem } from '@local-data/types';

// fetchLocalItems remains the same
export const fetchLocalItems = async (): Promise<LocalItem[]> => {
  console.log('[DEBUG] 1. Calling fetchLocalItems...');
  const response = await fetch('/api/local-items');
  if (!response.ok) { /* ... error handling ... */ throw new Error('Failed'); }
  const data: LocalItem[] = await response.json();
  console.log('[DEBUG] 2. Received data in fetchLocalItems:', data);
  return data;
};

// NEW: Define the expected shape of the backend's response for external items
export interface ExternalApiResponse {
  items: LocalItem[];
  totalResultsFromSource: number;
  source: string;
  requestParams: {
    limit: number;
    offset: number;
  };
}

// --- THIS IS THE REAL FUNCTION NOW ---
export const fetchExternalItems = async (params: { 
  location?: string; 
  query?: string;
  // Add page for future pagination if you re-implement it
  // page?: number; 
}): Promise<LocalItem[]> => { // For now, let's keep it simple and return LocalItem[]
  console.log(`[REAL API] Fetching EXTERNAL items with params:`, params);

  const queryParams = new URLSearchParams();
  if (params.location) queryParams.append('location', params.location);
  if (params.query) queryParams.append('term', params.query); // Backend uses 'term'
  // if (params.page) queryParams.append('offset', ((params.page - 1) * YOUR_ITEMS_PER_PAGE).toString());
  // You'll need to decide ITEMS_PER_PAGE if you add pagination back.

  const response = await fetch(`/api/external/items?${queryParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[REAL API] Error fetching external items:', errorData);
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  const data: ExternalApiResponse = await response.json();
  console.log('[REAL API] Successfully fetched and transformed external items:', data);
  
  // For now, we just return the items.
  // Later, if you re-add pagination, you'll return the whole 'data' object.
  return data.items; 
};