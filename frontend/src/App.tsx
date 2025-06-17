import { useEffect, useState, useMemo } from 'react';
import './App.css';
import type { LocalItem } from '@local-data/types';
import { LocalItemCard } from './components/LocalItemCard';
import { fetchLocalItems, fetchExternalItems } from './services/localItemService';

function App() {
  // --- STATE FOR INITIAL STAGE (SIMULATED DATA) ---
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // --- STATE FOR ADVANCED STAGE (EXTERNAL API) ---
  const [location, setLocation] = useState<string>('New York');
  const [externalQuery, setExternalQuery] = useState<string>('food');
  const [externalItems, setExternalItems] = useState<LocalItem[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState<boolean>(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      // ... (This logic remains unchanged)
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
  }, []);

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

  // --- UPDATED HANDLER FUNCTION FOR EXTERNAL SEARCH ---
  const handleExternalSearch = async () => {
    // **CHANGE 1: Immediately set loading state and clear old data/errors.**
    setIsExternalLoading(true);
    setExternalItems([]); // Clear previous results
    setExternalError(null); // Clear previous errors

    try {
      const data = await fetchExternalItems({ location, query: externalQuery });
      setExternalItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setExternalError(err.message);
      } else {
        setExternalError('An unknown error occurred during external search.');
      }
      // No need to setExternalItems([]) here, we already did it.
    } finally {
      // **CHANGE 2: Just set loading to false in the finally block.**
      setIsExternalLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Local Information Viewer</h1>
      
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

      {/* --- UPDATED RESULTS DISPLAY LOGIC --- */}
      {/* **CHANGE 3: This whole block is now structured to only show one state at a time.** */}
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
      {/* --- END OF UPDATED RESULTS DISPLAY --- */}

      <hr style={{ margin: '40px 0' }} />

      {/* --- UI FOR INITIAL STAGE (SIMULATED DATA) --- */}
      {/* ... (This entire section remains unchanged) ... */}
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