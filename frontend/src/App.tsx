import { useEffect, useState, useMemo } from 'react';
import './App.css';
import type { LocalItem } from '@local-data/types';
import { LocalItemCard } from './components/LocalItemCard';
// We now import both service functions
import { fetchLocalItems, fetchExternalItems } from './services/localItemService';

function App() {
  // --- STATE FOR INITIAL STAGE (SIMULATED DATA) ---
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // --- NEW STATE FOR ADVANCED STAGE (EXTERNAL API) ---
  const [location, setLocation] = useState<string>('New York'); // Default location
  const [externalQuery, setExternalQuery] = useState<string>('food'); // Default query
  const [externalItems, setExternalItems] = useState<LocalItem[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState<boolean>(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  // --- END OF NEW STATE ---

  // This useEffect only runs once to load the initial simulated data
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchLocalItems();
        setLocalItems(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching items.');
        }
        setLocalItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, []);

  // Filtering for the initial simulated data list
  const filteredLocalItems = useMemo(() => {
    // ... (This logic remains unchanged)
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

  // --- NEW HANDLER FUNCTION FOR EXTERNAL SEARCH ---
  const handleExternalSearch = async () => {
    setIsExternalLoading(true);
    setExternalError(null);
    try {
      // Call our new (mocked) service function with the state values
      const data = await fetchExternalItems({ location, query: externalQuery });
      setExternalItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setExternalError(err.message);
      } else {
        setExternalError('An unknown error occurred during external search.');
      }
      setExternalItems([]);
    } finally {
      setIsExternalLoading(false);
    }
  };
  // --- END OF NEW HANDLER ---

  return (
    <div className="App">
      <h1>Local Information Viewer</h1>
      
      {/* --- NEW UI FOR ADVANCED STAGE SEARCH --- */}
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
      {/* --- END OF NEW UI --- */}

      {/* --- NEW RESULTS DISPLAY FOR EXTERNAL DATA --- */}
      <div className="items-list-container">
        {isExternalLoading && <p>Loading external data...</p>}
        {externalError && <p style={{ color: 'red' }}>Error: {externalError}</p>}
        {externalItems.length > 0 && (
          <>
            <h3>External Search Results</h3>
            {externalItems.map(item => (
              <LocalItemCard key={item.id} item={item} />
            ))}
          </>
        )}
      </div>
      {/* --- END OF NEW RESULTS DISPLAY --- */}

      <hr style={{ margin: '40px 0' }} />

      {/* --- UI FOR INITIAL STAGE (SIMULATED DATA) --- */}
      <div className="search-container">
        <h2>Filter Simulated Local Data</h2>
        {!isLoading && !error && (
          <input
            type="text"
            placeholder="Filter the list below..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        )}
      </div>

      <div className="items-list-container">
        {isLoading && <p>Loading local items...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && filteredLocalItems.length > 0 && (
          filteredLocalItems.map(item => (
            <LocalItemCard key={item.id} item={item} />
          ))
        )}
        {!isLoading && !error && localItems.length > 0 && filteredLocalItems.length === 0 && (
          <p>No simulated items match your filter.</p>
        )}
      </div>
      {/* --- END OF INITIAL STAGE UI --- */}
    </div>
  );
}

export default App;