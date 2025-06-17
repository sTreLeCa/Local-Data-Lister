import { useEffect, useState, useMemo } from 'react';
import './App.css';
import type { LocalItem } from '@local-data/types';
import { LocalItemCard } from './components/LocalItemCard';
import { fetchLocalItems, fetchExternalItems } from './services/localItemService';

function App() {
  // --- STATE FOR INITIAL STAGE (SIMULATED DATA) ---
  // This group of state variables manages the data loaded from the local JSON file.
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(''); // For client-side filtering

  // --- STATE FOR ADVANCED STAGE (EXTERNAL API) ---
  // This group manages the UI and data related to the external API search.
  const [location, setLocation] = useState<string>('New York');
  const [externalQuery, setExternalQuery] = useState<string>('food');
  const [externalItems, setExternalItems] = useState<LocalItem[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState<boolean>(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  // This useEffect hook runs only once on initial component mount to load the
  // static list of items from the backend's simulated endpoint.
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchLocalItems();
        setLocalItems(data);
      } catch (err) {
        if (err instanceof Error) { setError(err.message); } 
        else { setError('An unknown error occurred while fetching items.'); }
        setLocalItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, []); // The empty dependency array ensures this runs only once.

  // useMemo is used for performance optimization. This filtering logic only
  // re-runs when the `localItems` list or the `searchTerm` changes, not on every render.
  const filteredLocalItems = useMemo(() => {
    if (!searchTerm.trim()) return localItems;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return localItems.filter(item => {
      if (item.name.toLowerCase().includes(lowerSearchTerm)) return true;
      if (item.description.toLowerCase().includes(lowerSearchTerm)) return true;
      switch (item.type) {
        case 'restaurant': return item.cuisineType.toLowerCase().includes(lowerSearchTerm);
        case 'park': return item.parkType.toLowerCase().includes(lowerSearchTerm) || item.amenities?.some(a => a.toLowerCase().includes(lowerSearchTerm));
        case 'event': return item.eventType.toLowerCase().includes(lowerSearchTerm);
      }
      return false;
    });
  }, [localItems, searchTerm]);

  // Handler for the external search button.
  // This provides a better UX by clearing old results and showing a loading
  // state immediately when a new search is initiated.
  const handleExternalSearch = async () => {
    setIsExternalLoading(true);
    setExternalItems([]);
    setExternalError(null);

    try {
      const data = await fetchExternalItems({ location, query: externalQuery });
      setExternalItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setExternalError(err.message);
      } else {
        setExternalError('An unknown error occurred during external search.');
      }
    } finally {
      setIsExternalLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Local Information Viewer</h1>
      
      {/* External Search Section */}
      <div className="search-container">
        <h2>Search Real-World Data (via Mock API)</h2>
        <input
          type="text"
          placeholder="Enter a location (e.g., Chicago)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="search-input"
        />
        <input
          type="text"
          placeholder="Enter a query (e.g., park, pizza)"
          value={externalQuery}
          onChange={(e) => setExternalQuery(e.target.value)}
          className="search-input"
        />
        <button onClick={handleExternalSearch} disabled={isExternalLoading} className="search-button">
          {isExternalLoading ? 'Searching...' : 'Search External Data'}
        </button>
      </div>

      {/* Conditional rendering block for the external search results. */}
      {/* This ensures only one state (loading, error, or results) is shown at a time. */}
      <div className="items-list-container">
        {isExternalLoading && <p>Loading external data...</p>}
        {externalError && <p style={{ color: 'red' }}>Error: {externalError}</p>}
        {!isExternalLoading && !externalError && externalItems.length > 0 && (
          <>
            <h3>External Search Results</h3>
            {externalItems.map(item => (
              <LocalItemCard key={item.id} item={item} />
            ))}
          </>
        )}
      </div>

      <hr style={{ margin: '40px 0' }} />

      {/* Initial Simulated Data Section */}
      <div className="search-container">
        <h2>Filter Simulated Local Data</h2>
        {!isLoading && !error && (
          <input type="text" placeholder="Filter the list below..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
        )}
      </div>
      <div className="items-list-container">
        {isLoading && <p>Loading local items...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && filteredLocalItems.length > 0 && (
          filteredLocalItems.map(item => <LocalItemCard key={item.id} item={item} />)
        )}
        {!isLoading && !error && localItems.length > 0 && filteredLocalItems.length === 0 && (
          <p>No simulated items match your filter.</p>
        )}
      </div>
    </div>
  );
}

export default App;