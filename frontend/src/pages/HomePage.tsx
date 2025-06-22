import { useEffect, useState, useMemo } from 'react';
import type { LocalItem } from '@local-data/types';
import { LocalItemCard } from '../components/LocalItemCard';
import { fetchLocalItems, fetchExternalItems } from '../api/localItemService';
import { useAuthStore } from '../store/authStore';
import { fetchFavorites, addFavorite, removeFavorite } from '../api/favoritesService';
import { Spinner } from '../components/Spinner/Spinner';
import toast from 'react-hot-toast';

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
          setFavoriteIds(new Set(favs.map(fav => fav.id)));
        })
        .catch(err => console.error("Could not fetch favorites:", err));
    } else {
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
      toast.error("Please log in to manage favorites.");
      return;
    }

    const isCurrentlyFavorited = favoriteIds.has(item.id);
    setFavoriteIds(prevIds => {
      const newIds = new Set(prevIds);
      if (isCurrentlyFavorited) newIds.delete(item.id);
      else newIds.add(item.id);
      return newIds;
    });

    try {
      if (isCurrentlyFavorited) {
        await removeFavorite(token, item.id);
        toast.success(`${item.name} removed from favorites!`);
      } else {
        await addFavorite(token, item);
        toast.success(`${item.name} added to favorites!`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      setFavoriteIds(prevIds => {
        const newIds = new Set(prevIds);
        if (isCurrentlyFavorited) newIds.add(item.id);
        else newIds.delete(item.id);
        return newIds;
      });
    }
  };

  const itemsToDisplay = useMemo(() => {
    const sourceItems = externalItems.length > 0 ? externalItems : localItems;
    if (!filterTerm.trim()) {
      return sourceItems;
    }

    const lowerSearchTerm = filterTerm.toLowerCase();
    
    return sourceItems.filter(item => {
      // Create a single searchable string from all relevant fields for each item
      const searchableContent = [
        item.name,
        item.description,
        item.location.city,
        item.location.state,
        item.location.street,
        item.rating?.toString(),
      ];

      // Add type-specific fields to the searchable content
      switch (item.type) {
        case 'Restaurant':
          searchableContent.push(item.cuisineType);
          searchableContent.push(item.priceRange);
          break;
        case 'Park':
          searchableContent.push(item.parkType);
          if (item.amenities) {
            searchableContent.push(...item.amenities);
          }
          break;
        case 'Event':
          searchableContent.push(item.eventType);
          searchableContent.push(item.organizer);
          break;
      }
      
      // Filter out any null/undefined values, join, and check for the search term
      return searchableContent
        .filter(Boolean) // Removes null, undefined, and empty strings
        .join(' ')
        .toLowerCase()
        .includes(lowerSearchTerm);
    });
  }, [externalItems, localItems, filterTerm]);

  return (
    <>
      <div className="content-wrapper">
        <div className="search-panel">
          <h2>Search Real-World Data</h2>
          <p>Find places anywhere using the Foursquare API.</p>
          <input
            type="text"
            placeholder="Enter a location (e.g., Chicago)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="search-input"
          />
          <input
            type="text"
            placeholder="Find (e.g., park, pizza)"
            value={externalTerm}
            onChange={(e) => setExternalTerm(e.target.value)}
            className="search-input"
          />
          <button
            onClick={handleExternalSearch}
            disabled={isExternalLoading || !location.trim()}
            className="search-button"
          >
            {isExternalLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="filter-panel">
          <h2>Filter Current Results</h2>
          <input
            type="text"
            placeholder="Filter by name, cuisine, amenities..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="items-list-container">
        {(isLoading || isExternalLoading) && <Spinner />}
        {error && <p className="error-message">Error: {error}</p>}
        
        {!isLoading && !isExternalLoading && itemsToDisplay.map((item, index) => (
          <div 
            key={item.id} 
            className="fade-in-item" 
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <LocalItemCard 
              item={item}
              isAuth={isAuthenticated()}
              isFavorited={favoriteIds.has(item.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        ))}

        {!isLoading && !isExternalLoading && itemsToDisplay.length === 0 && !error && (
            <p className="empty-state-message">No items to display. Try a new search or clear your filter.</p>
        )}
      </div>
    </>
  );
}