import { useEffect, useState, useMemo } from 'react';
import '../App.css';
import type { LocalItem } from '@local-data/types';
import { LocalItemCard } from '../components/LocalItemCard';
import { fetchLocalItems, fetchExternalItems } from '../api/localItemService';

export function HomePage() {
  // --- STATE FOR INITIAL STAGE (SIMULATED DATA) ---
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTerm, setFilterTerm] = useState<string>('');

  // --- STATE FOR ADVANCED STAGE (EXTERNAL API) ---
  const [location, setLocation] = useState<string>('New York');
  const [externalTerm, setExternalTerm] = useState<string>('food');
  const [externalItems, setExternalItems] = useState<LocalItem[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState<boolean>(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[DEBUG] App mounted. Fetching local items...');
    const loadItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchLocalItems();
        console.log('[DEBUG] Local items fetched:', data);
        setLocalItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[DEBUG] Error fetching local items:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching items.');
        }
        setLocalItems([]);
      } finally {
        setIsLoading(false);
        console.log('[DEBUG] Finished loading local items.');
      }
    };
    loadItems();
  }, []);

  const filteredLocalItems = useMemo(() => {
    console.log('[DEBUG] Filtering localItems with term:', filterTerm);
    if (!Array.isArray(localItems)) {
      console.error('[DEBUG] localItems is not an array!', localItems);
      return [];
    }
    if (!filterTerm.trim()) return localItems;

    const lowerSearchTerm = filterTerm.toLowerCase();
    const filtered = localItems.filter(item => {
      if (!item || typeof item.name !== 'string') return false;
      if (item.name.toLowerCase().includes(lowerSearchTerm)) return true;
      if (item.description.toLowerCase().includes(lowerSearchTerm)) return true;
      switch (item.type) {
        case 'Restaurant':
          return item.cuisineType.toLowerCase().includes(lowerSearchTerm);
        case 'Park':
          return item.parkType.toLowerCase().includes(lowerSearchTerm) ||
            item.amenities?.some(a => a.toLowerCase().includes(lowerSearchTerm));
        case 'Event':
          return item.eventType.toLowerCase().includes(lowerSearchTerm);
        default:
          return false;
      }
    });

    console.log('[DEBUG] Filtered local items:', filtered);
    return filtered;
  }, [localItems, filterTerm]);

  const handleExternalSearch = async () => {
    console.log('[DEBUG] External search triggered with:', { location, externalTerm });
    setIsExternalLoading(true);
    setExternalItems([]);
    setExternalError(null);

    try {
      const data = await fetchExternalItems({ location, query: externalTerm });
      console.log('[DEBUG] External items fetched:', data);
      setExternalItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[DEBUG] Error fetching external items:', err);
      if (err instanceof Error) {
        setExternalError(err.message);
      } else {
        setExternalError('An unknown error occurred during external search.');
      }
    } finally {
      setIsExternalLoading(false);
      console.log('[DEBUG] Finished loading external items.');
    }
  };

  // Debug all state at render time
  console.log('[DEBUG] App render cycle triggered.');
  console.log('[DEBUG] State summary:', {
    isLoading,
    error,
    localItemsCount: localItems.length,
    filterTerm,
    filteredLocalItemsCount: filteredLocalItems.length,
    externalItemsCount: externalItems.length,
    isExternalLoading,
    externalError,
    location,
    externalTerm
  });

  return (
    <div className="App">
      <h1>Local Information Viewer</h1>

      <div className="search-container">
        <h2>Search Real-World Data (via Foursquare API)</h2>
        <input
          type="text"
          placeholder="Enter a location (e.g., Chicago)"
          value={location}
          onChange={(e) => {
            console.log('[DEBUG] Location changed to:', e.target.value);
            setLocation(e.target.value);
          }}
          className="search-input"
        />
        <input
          type="text"
          placeholder="Enter a search term (e.g., park, pizza)"
          value={externalTerm}
          onChange={(e) => {
            console.log('[DEBUG] External search term changed to:', e.target.value);
            setExternalTerm(e.target.value);
          }}
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

      <div className="items-list-container">
        {isExternalLoading && <p>Loading external data...</p>}
        {externalError && <p style={{ color: 'red' }}>Error: {externalError}</p>}
        {!isExternalLoading && !externalError && externalItems.length > 0 && (
          <>
            <h3>External Search Results</h3>
            {externalItems.map(item => {
              console.log('[DEBUG] Rendering external LocalItemCard:', item);
              return <LocalItemCard key={item.id} item={item} />;
            })}
          </>
        )}
      </div>

      <hr style={{ margin: '40px 0' }} />

      <div className="search-container">
        <h2>Filter Simulated Local Data</h2>
        <input
          type="text"
          placeholder="Filter the list below..."
          value={filterTerm}
          onChange={(e) => {
            console.log('[DEBUG] Filter term changed to:', e.target.value);
            setFilterTerm(e.target.value);
          }}
          className="search-input"
        />
      </div>

      <div className="items-list-container">
        {isLoading ? (
          <p>Loading local items...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : filteredLocalItems.length > 0 ? (
          filteredLocalItems.map(item => {
            console.log('[DEBUG] Rendering local LocalItemCard:', item);
            return <LocalItemCard key={item.id} item={item} />;
          })
        ) : (
          <p>No items to display.</p>
        )}
      </div>
    </div>
  );
}