import { useEffect, useState, useMemo } from 'react';
import './App.css';
import type { LocalItem, Restaurant, Park, Event as LocalEventType } from '@local-data/types';
import { LocalItemCard } from './components/LocalItemCard';
import { fetchLocalItems, fetchExternalItems } from './services/localItemService';

function App() {
  // --- STATE FOR INITIAL/SIMULATED DATA ---
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState<boolean>(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localFilterTerm, setLocalFilterTerm] = useState<string>('');

  // --- STATE FOR ADVANCED/EXTERNAL DATA ---
  const [searchLocation, setSearchLocation] = useState<string>('New York');
  const [searchQuery, setSearchQuery] = useState<string>('restaurants');
  const [searchType, setSearchType] = useState<'Restaurant' | 'Park' | 'Event' | ''>('');

  const [externalItems, setExternalItems] = useState<LocalItem[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState<boolean>(false);
  const [externalApiError, setExternalApiError] = useState<string | null>(null);
  const [externalFilterTerm, setExternalFilterTerm] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  // --- HOOKS ---
  useEffect(() => {
    const loadItems = async () => {
      setIsLoadingLocal(true);
      setLocalError(null);
      try {
        const data = await fetchLocalItems();
        setLocalItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof Error) { setLocalError(err.message); }
        else { setLocalError('An unknown error occurred while fetching local items.'); }
        setLocalItems([]);
      } finally {
        setIsLoadingLocal(false);
      }
    };
    loadItems();
  }, []);

  const filteredLocalItems = useMemo(() => {
    if (!Array.isArray(localItems)) return [];
    if (!localFilterTerm.trim()) return localItems;
    const lowerTerm = localFilterTerm.toLowerCase();
    return localItems.filter(item => {
      if (item.name.toLowerCase().includes(lowerTerm)) return true;
      if (item.description.toLowerCase().includes(lowerTerm)) return true;
      switch (item.type) {
        case 'Restaurant': return (item as Restaurant).cuisineType.toLowerCase().includes(lowerTerm);
        case 'Park': return (item as Park).parkType.toLowerCase().includes(lowerTerm) || (item as Park).amenities?.some(a => a.toLowerCase().includes(lowerTerm));
        case 'Event': return (item as LocalEventType).eventType.toLowerCase().includes(lowerTerm);
      }
      return false;
    });
  }, [localItems, localFilterTerm]);

  const filteredExternalItems = useMemo(() => {
    if (!Array.isArray(externalItems)) return [];
    if (!externalFilterTerm.trim()) return externalItems;
    const lowerTerm = externalFilterTerm.toLowerCase();
    return externalItems.filter(item => {
      if (item.name.toLowerCase().includes(lowerTerm)) return true;
      if (item.description.toLowerCase().includes(lowerTerm)) return true;
      switch (item.type) {
        case 'Restaurant':
          const restaurant = item as Restaurant;
          if (restaurant.cuisineType.toLowerCase().includes(lowerTerm)) return true;
          if (restaurant.priceRange?.includes(lowerTerm)) return true;
          break;
        case 'Park':
          const park = item as Park;
          if (park.parkType.toLowerCase().includes(lowerTerm)) return true;
          if (park.amenities?.some(a => a.toLowerCase().includes(lowerTerm))) return true;
          break;
        case 'Event':
          const event = item as LocalEventType;
          if (event.eventType.toLowerCase().includes(lowerTerm)) return true;
          if (event.organizer?.toLowerCase().includes(lowerTerm)) return true;
          break;
      }
      return false;
    });
  }, [externalItems, externalFilterTerm]);

  // --- HANDLERS ---
  const handleExternalSearchSubmit = async () => {
    if (!searchLocation.trim() && !searchQuery.trim() && !searchType.trim()) {
        setExternalApiError("Please enter a location, search term, or select a type.");
        setHasSearched(true);
        setExternalItems([]);
        return;
    }
    setHasSearched(true);
    setIsExternalLoading(true);
    setExternalItems([]); 
    setExternalApiError(null);
    setExternalFilterTerm(''); // Reset sub-filter on new API search

    try {
      // Pass searchType to backend. Backend currently uses 'term' for Foursquare's 'query'.
      // A backend enhancement would be needed to map 'searchType' to Foursquare category IDs.
      const params: {location?: string, query?: string, type?: string} = {};
      if (searchLocation.trim()) params.location = searchLocation;
      if (searchQuery.trim()) params.query = searchQuery;
      if (searchType.trim()) params.type = searchType; // Sending type

      const data = await fetchExternalItems(params);
      setExternalItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof Error) { setExternalApiError(err.message); }
      else { setExternalApiError('An unknown error occurred during external search.'); }
    } finally {
      setIsExternalLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Local Information Viewer</h1>
      
      <section className="search-section">
        <h2>Search Real-World Data (via Foursquare API)</h2>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Location (e.g., New York)"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="search-input"
          />
          <input
            type="text"
            placeholder="Search term (e.g., italian food, parks)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value as any)}
            className="search-input type-select"
          >
            <option value="">All Categories</option>
            <option value="Restaurant">Restaurants</option>
            <option value="Park">Parks</option>
            <option value="Event">Events/Venues</option>
          </select>
          <button 
            onClick={handleExternalSearchSubmit} 
            disabled={isExternalLoading || (!searchLocation.trim() && !searchQuery.trim() && !searchType.trim())} 
            className="search-button"
          >
            {isExternalLoading ? 'Searching...' : 'Search External Data'}
          </button>
        </div>
      </section>

      <section className="results-section">
        {/* Heading is always present after a search has been initiated, or if loading/error */}
        {(hasSearched || isExternalLoading || externalApiError) && (
            <h3>External Search Results</h3>
        )}

        {isExternalLoading && <p className="status-message">Loading external data...</p>}
        {externalApiError && <p className="status-message error-message">Error: {externalApiError}</p>}
        
        {/* Logic for displaying filter or "no API results" message */}
        {!isExternalLoading && !externalApiError && hasSearched && (
          <>
            {externalItems.length > 0 ? (
              // If there are original API items, show the filter input
              <div className="filter-container">
                <input
                  type="text"
                  placeholder="Filter these results further..."
                  value={externalFilterTerm}
                  onChange={(e) => setExternalFilterTerm(e.target.value)}
                  className="search-input filter-input"
                />
              </div>
            ) : (
              // If API returned no items
              <p className="status-message">No results found from your API search.</p>
            )}
          </>
        )}
        
        {/* Logic for displaying the filtered API results or "no match for filter" */}
        {!isExternalLoading && !externalApiError && externalItems.length > 0 && (
          <>
            {filteredExternalItems.length > 0 ? (
              <div className="items-list-container external-items-grid">
                {filteredExternalItems.map(item => <LocalItemCard key={item.id} item={item} />)}
              </div>
            ) : (
              // This shows if the client-side filter on existing API results yields nothing
              externalFilterTerm.trim() && <p className="status-message">No items match your current filter.</p>
            )}
          </>
        )}
        {/* Pagination would go here */}
      </section>

      <hr />

      <section className="search-section local-data-section">
        <h2>Filter Simulated Local Data</h2>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Filter the list below..."
            value={localFilterTerm}
            onChange={(e) => setLocalFilterTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </section>
      
      <section className="results-section">
        {isLoadingLocal && <p className="status-message">Loading local items...</p>}
        {localError && <p className="status-message error-message">Error: {localError}</p>}
        {!isLoadingLocal && !localError && filteredLocalItems.length === 0 && localItems.length > 0 && (
          <p className="status-message">No simulated items match your filter.</p>
        )}
        {!isLoadingLocal && !localError && localItems.length === 0 && (
            <p className="status-message">No local items available.</p>
        )}
        {!isLoadingLocal && !localError && filteredLocalItems.length > 0 && (
          <div className="items-list-container local-items-grid">
            {filteredLocalItems.map(item => <LocalItemCard key={item.id} item={item} />)}
          </div>
        )}
      </section>
    </div>
  );
}
export default App;