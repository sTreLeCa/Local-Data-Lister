import { useEffect, useState, useMemo } from 'react';
import type { LocalItem } from '@local-data/types';
import { LocalItemCard } from '../components/LocalItemCard';
import { fetchLocalItems, fetchExternalItems } from '../api/localItemService';
import { useAuthStore } from '../store/authStore';
import { fetchFavorites, addFavorite, removeFavorite } from '../api/favoritesService';

export function HomePage() {
  // --- State for Data & UI ---
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [externalItems, setExternalItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExternalLoading, setIsExternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State for Search & Filtering ---
  const [filterTerm, setFilterTerm] = useState('');
  const [location, setLocation] = useState('New York');
  const [externalTerm, setExternalTerm] = useState('food');
  
  // --- State for Authentication & User Favorites ---
  const { token, isAuthenticated } = useAuthStore();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Effect to fetch initial local data once on component mount
  useEffect(() => {
    fetchLocalItems()
      .then(setLocalItems)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // Effect to fetch user's favorites whenever their login status changes
  useEffect(() => {
    if (isAuthenticated() && token) {
      fetchFavorites(token)
        .then(favs => {
          // Storing only IDs in a Set is highly efficient for checking if an item is favorited
          setFavoriteIds(new Set(favs.map(fav => fav.id)));
        })
        .catch(err => console.error("Could not fetch favorites:", err));
    } else {
      // Clear favorites when the user logs out
      setFavoriteIds(new Set());
    }
  }, [token, isAuthenticated]);

  // Handler for the external API search
  const handleExternalSearch = async () => {
    setIsExternalLoading(true);
    setError(null);
    fetchExternalItems({ location, query: externalTerm })
      .then(setExternalItems)
      .catch(err => setError(err.message))
      .finally(() => setIsExternalLoading(false));
  };
  
  // Handler for toggling an item's favorite status
  const handleToggleFavorite = async (item: LocalItem) => {
    if (!isAuthenticated() || !token) {
      alert("Please log in to add items to your favorites.");
      return;
    }

    const isCurrentlyFavorited = favoriteIds.has(item.id);

    try {
      if (isCurrentlyFavorited) {
        // --- Remove from favorites ---
        await removeFavorite(token, item.id);
        setFavoriteIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.delete(item.id);
          return newIds;
        });
      } else {
        // --- Add to favorites ---
        await addFavorite(token, item);
        setFavoriteIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.add(item.id);
          return newIds;
        });
      }
    } catch (err: any) {
      alert(`Error updating favorites: ${err.message}`);
      console.error(err);
    }
  };

  // Memoized logic to filter the local items list based on the filter input
  const filteredLocalItems = useMemo(() => {
    if (!filterTerm.trim()) return localItems;
    const lowerSearchTerm = filterTerm.toLowerCase();
    return localItems.filter(item => 
      item.name.toLowerCase().includes(lowerSearchTerm) || 
      item.description.toLowerCase().includes(lowerSearchTerm)
    );
  }, [localItems, filterTerm]);

  // Combine external results and filtered local results into a single list for rendering
  const itemsToDisplay = externalItems.length > 0 ? externalItems : filteredLocalItems;

  return (
    <>
      <div className="search-container">
        <h2>Search Real-World Data (via Foursquare API)</h2>
        <input
          type="text"
          placeholder="Enter a location (e.g., Chicago)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="search-input"
        />
        <input
          type="text"
          placeholder="Enter a search term (e.g., park, pizza)"
          value={externalTerm}
          onChange={(e) => setExternalTerm(e.target.value)}
          className="search-input"
        />
        <button
          onClick={handleExternalSearch}
          disabled={isExternalLoading || !location.trim()}
          className="search-button"
        >
          {isExternalLoading ? 'Searching...' : 'Search External Data'}
        </button>
      </div>

      <hr style={{ margin: '40px 0' }} />

      <div className="search-container">
        <h2>Filter Local Data</h2>
        <input
          type="text"
          placeholder="Filter the list below..."
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="items-list-container">
        {/* --- Unified Loading and Error States --- */}
        {(isLoading || isExternalLoading) && <p>Loading items...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        
        {/* --- Unified Rendering Logic --- */}
        {!isLoading && !isExternalLoading && itemsToDisplay.map(item => (
          <LocalItemCard 
            key={item.id} 
            item={item}
            isAuth={isAuthenticated()}
            isFavorited={favoriteIds.has(item.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}

        {/* --- Message for No Results --- */}
        {!isLoading && !isExternalLoading && itemsToDisplay.length === 0 && !error && (
            <p>No items to display. Try a new search or clear your filter.</p>
        )}
      </div>
    </>
  );
}