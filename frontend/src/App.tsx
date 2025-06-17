import { useEffect, useState, useMemo } from 'react';
import './App.css';
import type { LocalItem } from '@local-data/types';
import { LocalItemCard } from './components/LocalItemCard';
import { fetchLocalItems } from './services/localItemService';

function App() {
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const filteredLocalItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return localItems;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return localItems.filter(item => {
      if (item.name.toLowerCase().includes(lowerSearchTerm)) return true;
      if (item.description.toLowerCase().includes(lowerSearchTerm)) return true;
      if (item.location.street?.toLowerCase().includes(lowerSearchTerm)) return true;
      if (item.location.city?.toLowerCase().includes(lowerSearchTerm)) return true;
      if (item.location.state?.toLowerCase().includes(lowerSearchTerm)) return true;

      switch (item.type) {
        case 'restaurant':
          if (item.cuisineType.toLowerCase().includes(lowerSearchTerm)) return true;
          break;
        case 'event':
          if (item.eventType.toLowerCase().includes(lowerSearchTerm)) return true;
          break;
        case 'park':
          if (item.parkType.toLowerCase().includes(lowerSearchTerm)) return true;
          if (item.amenities?.some(amenity => amenity.toLowerCase().includes(lowerSearchTerm))) return true;
          break;
      }
      return false;
    });
  }, [localItems, searchTerm]);

  let contentToRender;
  if (isLoading) {
    contentToRender = <p>Loading local items...</p>;
  } else if (error) {
    contentToRender = <p style={{ color: 'red' }}>Error: {error}</p>;
  } else if (localItems.length === 0) {
    contentToRender = <p>No local items available at the moment.</p>;
  } else if (filteredLocalItems.length === 0 && searchTerm.trim() !== '') {
    contentToRender = <p>No items match your search criteria "{searchTerm}".</p>;
  } else {
    contentToRender = (
      <div>
        {filteredLocalItems.map(item => (
          <LocalItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Local Information Viewer</h1>
      {!isLoading && !error && (
        <div style={{ margin: '20px 0', padding: '0 10px' }}>
          <input
            type="text"
            placeholder="Search by name, description, location, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px', width: '100%', maxWidth: '600px', boxSizing: 'border-box', fontSize: '1em', display: 'block', margin: '0 auto 20px auto' }}
          />
        </div>
      )}
      <div className="items-list-container">{contentToRender}</div>
    </div>
  );
}
export default App;