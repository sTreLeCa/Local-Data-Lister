// frontend/src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { fetchPopularItems, PopularItem } from '../api/dashboardService';
import { LocalItemCard } from '../components/LocalItemCard';
import { useAuthStore } from '../store/authStore';
import { fetchFavorites } from '../api/favoritesService'; // We need this to show correct favorite status

export const DashboardPage = () => {
    const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // We still need to know the user's favorites to display the hearts correctly.
    const { token, isAuthenticated } = useAuthStore();
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    // This is a great example of re-using logic. We fetch favorites here
    // just like we did on the HomePage.
    useEffect(() => {
        if (isAuthenticated() && token) {
            fetchFavorites(token)
                .then(favs => setFavoriteIds(new Set(favs.map(f => f.id))))
                .catch(console.error);
        }
    }, [token, isAuthenticated]);

    // Fetch the popular items data when the component mounts.
    useEffect(() => {
        fetchPopularItems(10) // Fetch the top 10 items
            .then(data => {
                setPopularItems(data);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []); // The empty dependency array means this runs only once.

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
                                // We can't toggle favorites from this page yet, but we can show the status
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