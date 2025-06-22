import type { LocalItem } from '@local-data/types';
export type PopularItem = LocalItem & {
    favoriteCount: number;
};


/**
 * Fetches the most popular (most favorited) items.
 * GET /api/dashboard/popular-items
 * @param limit The number of popular items to fetch. Defaults to 10.
 */
export const fetchPopularItems = async (limit: number = 10): Promise<PopularItem[]> => {
    // The rest of the file is correct and does not need to change.
    const response = await fetch(`/api/dashboard/popular-items?limit=${limit}`);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch popular items');
    }
    
    return response.json();
};