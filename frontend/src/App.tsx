import { useEffect, useState, useMemo } from 'react'; 
import './App.css'; 
import type { LocalItem } from '@local-data/types';
import LocalItemCard from './components/LocalItemCard';
import { fetchLocalItems } from './services/localItemService';

const mockLocalItems: LocalItem[] = [
  {
    id: "r1", name: "Luigi's Pizza Palace", type: "restaurant",
    location: { street: "123 Main St", city: "Anytown", state: "CA", zipcode: "90210", latitude: 40.7550, longitude: -73.9990 },
    description: "Authentic Italian pizza with a cozy atmosphere.", cuisineType: "Italian", priceRange: "$$", rating: 4.5
  },
  {
    id: "p1", name: "City Center Park", type: "park",
    location: { street: "456 Oak Ave", city: "Anytown", state: "CA", zipcode: "90210", latitude: 40.7306, longitude: -73.9352 },
    description: "A beautiful green space perfect for picnics and walks.", parkType: "City Park", amenities: ["playground", "picnic tables", "walking trails"], rating: 4.8
  },
  {
    id: "e1", name: "Summer Music Fest", type: "event",
    location: { street: "789 Pine Ln", city: "Anytown", state: "CA", zipcode: "90210", latitude: 40.7484, longitude: -73.9857 },
    description: "Annual music festival featuring local and national bands.", eventType: "Music Festival", eventDate: "2025-07-15T18:00:00Z", price: 25.00, rating: 4.2
  },
  {
    id: "r2", name: "The Green Leaf Cafe", type: "restaurant",
    location: { street: "101 River Rd", city: "Otherville", state: "CA", zipcode: "90211", latitude: 40.7128, longitude: -74.0060 },
    description: "Healthy and delicious vegetarian options.", cuisineType: "Vegetarian", rating: 4.3
  },
  {
    id: "p2", name: "Riverside Gardens", type: "park",
    location: { city: "Metropolis", state: "NY", latitude: 40.7796, longitude: -73.9632 },
    description: "Beautiful botanical gardens along the river.", parkType: "Botanical Garden", amenities: ["river view", "benches"], rating: 4.7
  }
];

const mockFetchLocalItems = (): Promise<LocalItem[]> => {
  console.log("App.tsx: Using MOCK fetchLocalItems with MERGED types");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockLocalItems);
    }, 1000);
  });
};
// --- END OF MOCK ---

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
        // WHEN B-TASK 5 (frontend service) IS READY, REPLACE THIS: <--- ეს კომენტარიც წაშალე
        const data = await fetchLocalItems(); // <--- გამოიყენე იმპორტირებული ფუნქცია
        setLocalItems(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching items.');
        }
        setLocalItems([]); // Clear items on error
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  // P11.1: Create filteredLocalItems using useMemo
  const filteredLocalItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return localItems; // Return all if search term is empty
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return localItems.filter(item => {
      // Check common fields
      if (item.name.toLowerCase().includes(lowerSearchTerm)) return true;
      if (item.description.toLowerCase().includes(lowerSearchTerm)) return true;
      if (item.location.street?.toLowerCase().includes(lowerSearchTerm)) return true; // Optional chaining for street
      if (item.location.city?.toLowerCase().includes(lowerSearchTerm)) return true;   // Optional chaining for city
      if (item.location.state?.toLowerCase().includes(lowerSearchTerm)) return true;  // Optional chaining for state

      // Check type-specific fields
      switch (item.type) {
        case 'restaurant':
          if (item.cuisineType.toLowerCase().includes(lowerSearchTerm)) return true;
          break;
        case 'event':
          if (item.eventType.toLowerCase().includes(lowerSearchTerm)) return true;
          break;
        case 'park':
          if (item.parkType.toLowerCase().includes(lowerSearchTerm)) return true;
          if (item.amenities?.some(amenity => amenity.toLowerCase().includes(lowerSearchTerm))) return true; // Check amenities array
          break;
      }
      return false;
    });
  }, [localItems, searchTerm]); // Dependencies for useMemo

  // --- Conditional Rendering Logic ---
  let contentToRender;

  if (isLoading) {
    contentToRender = <p>Loading local items...</p>;
  } else if (error) {
    contentToRender = <p style={{ color: 'red' }}>Error: {error}</p>;
  } else if (localItems.length === 0) { // Initial fetch resulted in no items
    contentToRender = <p>No local items available at the moment.</p>;
  } else if (filteredLocalItems.length === 0 && searchTerm.trim() !== '') { // Search yielded no results
    contentToRender = <p>No items match your search criteria "{searchTerm}".</p>;
  } else {
    // Data loaded successfully and there are items to display (either all or filtered).
    contentToRender = (
      <div>
        {filteredLocalItems.map(item => ( // Map over filteredLocalItems
          <LocalItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Local Information Viewer</h1>
      
      {/* P10.1: Add search input - Conditionally render if not loading/error */}
      { !isLoading && !error && (
          <div style={{ margin: '20px 0', padding: '0 10px' }}> {/* Added padding for aesthetics */}
            <input
              type="text"
              placeholder="Search by name, description, location, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                padding: '10px', 
                width: '100%', // Make it take full width of its container
                maxWidth: '600px', // Optional: set a max-width
                boxSizing: 'border-box', 
                fontSize: '1em',
                display: 'block', // Make it a block element
                margin: '0 auto 20px auto' // Center it and add bottom margin
              }}
            />
          </div>
        )}

      <div className="items-list-container">
        {contentToRender}
      </div>
    </div>
  );
}

export default App;