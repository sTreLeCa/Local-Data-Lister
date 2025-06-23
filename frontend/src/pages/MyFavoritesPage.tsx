// frontend/src/pages/MyFavoritesPage.tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchFavorites, removeFavorite  } from '../api/favoritesService';
import { LocalItemCard } from '../components/LocalItemCard';
import type { LocalItem } from '@local-data/types';
import { Spinner } from '../components/Spinner/Spinner';

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

    const handleUnfavorite = async (itemToRemove: LocalItem) => {
        if (!token) return; // Should not happen if user is authenticated

        try {
            // Call the API to remove the favorite from the backend
            await removeFavorite(token, itemToRemove.id);

            // Update the frontend state to remove the item from the list instantly
            // This provides a fast, responsive UI without needing a page reload
            setFavorites(currentFavorites => 
                currentFavorites.filter(item => item.id !== itemToRemove.id)
            );
        } catch (err: any) {
            console.error("Failed to unfavorite item:", err);
            alert(`Error: ${err.message}`);
        }
    };

    if (!isAuthenticated()) {
        return <h2>Please log in to view your favorites.</h2>;
    }

    if (isLoading) {
        return <Spinner/>;
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
                        // --- 3. Pass the new props to the LocalItemCard ---
                        <LocalItemCard 
                            key={item.id} 
                            item={item}
                            isAuth={true} // We know the user is authenticated on this page
                            isFavorited={true} // Every item on this page is favorited by definition
                            onToggleFavorite={handleUnfavorite} // Pass the handler function
                        />
                    ))}
                </div>
            ) : (
                <p>You haven't favorited any items yet.</p>
            )}
        </div>
    );
};