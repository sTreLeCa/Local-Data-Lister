import { useEffect, useState, useCallback } from 'react';
import { fetchPopularItems, PopularItem } from '../api/dashboardService';
import { LocalItemCard } from '../components/LocalItemCard';
import { useAuthStore } from '../store/authStore';
import { fetchFavorites } from '../api/favoritesService';
import { useRealtime, FavoriteUpdateData } from '../hooks/useRealtime';

export const DashboardPage = () => {
    const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { token, isAuthenticated } = useAuthStore();
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    //The "smart" handler for WebSocket events ---
    // useCallback ensures this function is stable and doesn't cause re-renders
    const handleFavoriteUpdate = useCallback((data: FavoriteUpdateData) => {
        setPopularItems(currentItems => {
            let itemWasInList = false;

            const updatedItems = currentItems.map(item => {
                if (item.id === data.itemId) {
                    itemWasInList = true;
                    return {
                        ...item,
                        favoriteCount: data.action === 'added' 
                            ? item.favoriteCount + 1 
                            : Math.max(0, item.favoriteCount - 1) 
                    };
                }
                return item;
            });
            
            if (!itemWasInList) {
                fetchPopularItems(10).then(setPopularItems);
                return currentItems; 
            }
            return updatedItems.sort((a, b) => b.favoriteCount - a.favoriteCount);
        });
    }, []); // Empty dependency array = this function is created only once.

    // Use our real-time hook and pass it the handler ---
    useRealtime(handleFavoriteUpdate);

    // This effect runs once on initial mount to get the data
    useEffect(() => {
        fetchPopularItems(10)
            .then(setPopularItems)
            .catch(err => setError(err.message))
            .finally(() => setIsLoading(false));
    }, []); 

    // This effect gets the user's personal favorites for the heart icons
    useEffect(() => {
        if (isAuthenticated() && token) {
            fetchFavorites(token)
                .then(favs => setFavoriteIds(new Set(favs.map(f => f.id))))
                .catch(console.error);
        } else {
            setFavoriteIds(new Set());
        }
    }, [token, isAuthenticated]);

    // --- The rendering logic remains the same ---
    if (isLoading) {
        return <p>Loading most popular items...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <div>
            <h2>Most Popular Places</h2>
            <p>Here are the top spots, ranked by how many users have favorited them.</p>
            <div className="items-list-container">
                {popularItems.length > 0 ? (
                    popularItems.map(item => (
                        <div key={item.id} className="popular-item-wrapper">
                            <p className="favorite-count">
                                <strong>⭐ {item.favoriteCount} Favorites</strong>
                            </p>
                            <LocalItemCard 
                                item={item}
                                isAuth={isAuthenticated()}
                                isFavorited={favoriteIds.has(item.id)}
                            />
                        </div>
                    ))
                ) : (
                    <p>No favorited items to rank yet. Be the first to favorite something!</p>
                )}
            </div>
        </div>
    );
};