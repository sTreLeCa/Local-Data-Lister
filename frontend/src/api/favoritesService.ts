import type { LocalItem } from '@local-data/types';

// A helper to create the required authorization headers
const getAuthHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
});

/**
 * Fetches the list of favorited items for the logged-in user.
 * GET /api/me/favorites
 */
export const fetchFavorites = async (token: string): Promise<LocalItem[]> => {
    const response = await fetch('/api/me/favorites', {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch favorites');
    }
    return response.json();
};

/**
 * Adds an item to the user's favorites.
 * POST /api/me/favorites
 */
export const addFavorite = async (token: string, item: LocalItem): Promise<any> => {
    const response = await fetch('/api/me/favorites', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(item),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add favorite');
    }
    return response.json();
};

/**
 * Removes an item from the user's favorites.
 * DELETE /api/me/favorites/:itemId
 */
export const removeFavorite = async (token: string, itemId: string): Promise<void> => {
    const response = await fetch(`/api/me/favorites/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove favorite');
    }
};