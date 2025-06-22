// frontend/src/pages/MyFavoritesPage.tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchFavorites } from '../api/favoritesService';
import { LocalItemCard } from '../components/LocalItemCard';
import type { LocalItem } from '@local-data/types';

export const MyFavoritesPage = () => {
    const [favorites, setFavorites] = useState<LocalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { token, isAuthenticated } = useAuthStore();

    useEffect(() => {
        // Only fetch if the user is logged in
        if (isAuthenticated() && token) {
            fetchFavorites(token)
                .then(data => {
                    setFavorites(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setIsLoading(false);
                });
        } else {
            // If not authenticated, don't bother fetching
            setIsLoading(false);
        }
    }, [isAuthenticated, token]); // Re-run if auth state changes

    if (!isAuthenticated()) {
        return <h2>Please log in to view your favorites.</h2>;
    }

    if (isLoading) {
        return <p>Loading your favorites...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <div>
            <h2>My Favorites</h2>
            {favorites.length > 0 ? (
                <div className="items-list-container">
                    {favorites.map(item => (
                        <LocalItemCard key={item.id} item={item} />
                    ))}
                </div>
            ) : (
                <p>You haven't favorited any items yet.</p>
            )}
        </div>
    );
};