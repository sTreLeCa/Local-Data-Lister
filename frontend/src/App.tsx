import React, { useEffect, useState } from 'react';
import './App.css'; // Your main app styles
import type { LocalItem, Restaurant, Park, EventItem, Location } from './types'; // Import from your local types
import LocalItemCard from './components/LocalItemCard'; // Import your new component

// --- THIS IS MOCK DATA & FUNCTION - TO BE REPLACED LATER ---
const mockLocalItems: LocalItem[] = [
  {
    id: 'r1', name: 'Luigi\'s Pizza Palace', type: 'restaurant',
    location: { street: '123 Main St', city: 'Anytown', state: 'CA' },
    description: 'Authentic Italian pizza.', cuisineType: 'Italian', priceRange: '$$', rating: 4.5
  },
  {
    id: 'p1', name: 'City Center Park', type: 'park',
    location: { street: '456 Oak Ave', city: 'Anytown', state: 'CA' },
    description: 'A beautiful green space.', parkType: 'City Park', amenities: ['playground']
  },
  {
    id: 'e1', name: 'Summer Music Fest', type: 'event',
    location: { street: '789 Pine Ln', city: 'Anytown', state: 'CA' },
    description: 'Annual music festival.', eventType: 'Music Festival', eventDate: '2025-07-15'
  },
];

const mockFetchLocalItems = (): Promise<LocalItem[]> => {
  console.log("App.tsx: Using MOCK fetchLocalItems");
  return new Promise((resolve, reject) => { // Added reject for testing error state
    setTimeout(() => {
      // To test success:
      resolve(mockLocalItems);
      // To test error state:
      // reject(new Error("Mock API fetch failed deliberately!"));
      // To test empty state:
      // resolve([]);
    }, 1000); // Simulate network delay
  });
};
// --- END OF MOCK DATA AND FUNCTION ---

function App() {
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // WHEN B-TASK 5 (frontend service) IS READY, REPLACE THIS:
        const data = await mockFetchLocalItems(); 
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
  }, []); // Empty dependency array, run once on mount

  // Conditional rendering logic will be fully implemented in C-Task 2
  // For now, to verify this step:
  if (isLoading) {
    return <p>Loading local items...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h1>Local Information Viewer</h1>
      {localItems.length === 0 && !isLoading && <p>No items found (or initial empty data).</p>}
      {/* The actual list rendering will use LocalItemCard and will be refined in C-Task 2 */}
      {localItems.map(item => (
         <LocalItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default App;