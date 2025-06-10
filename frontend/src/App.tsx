import React, { useEffect, useState } from 'react';
import './App.css';
import type { LocalItem, Restaurant, Park, EventItem, Location } from '@local-data/types'; 
import LocalItemCard from './components/LocalItemCard';

// --- MOCK DATA & FUNCTION
const mockLocalItems: LocalItem[] = [
  {
    id: "r1",
    name: "Luigi's Pizza Palace",
    type: "restaurant", // Discriminator
    location: { 
      street: "123 Main St", city: "Anytown", state: "CA", zipcode: "90210",
      latitude: 40.7550, longitude: -73.9990            
    },
    description: "Authentic Italian pizza with a cozy atmosphere.",
    cuisineType: "Italian", 
    priceRange: "$$",
    rating: 4.5
  },
  {
    id: "p1",
    name: "City Center Park",
    type: "park", // Discriminator
    location: { 
      street: "456 Oak Ave", city: "Anytown", state: "CA", zipcode: "90210",
      latitude: 40.7306, longitude: -73.9352 
    },
    description: "A beautiful green space perfect for picnics and walks.",
    parkType: "City Park", 
    amenities: ["playground", "picnic tables", "walking trails"],
    rating: 4.8 
  },
  {
    id: "e1",
    name: "Summer Music Fest",
    type: "event", // Discriminator
    location: { 
      street: "789 Pine Ln", city: "Anytown", state: "CA", zipcode: "90210",
      latitude: 40.7484, longitude: -73.9857 
    },
    description: "Annual music festival featuring local and national bands.",
    eventType: "Music Festival", 
    eventDate: "2025-07-15T18:00:00Z", 
    price: 25.00,
    rating: 4.2
  },
  {
    id: "r2",
    name: "The Green Leaf Cafe",
    type: "restaurant",
    location: { 
      street: "101 River Rd", city: "Otherville", state: "CA", zipcode: "90211",
      latitude: 40.7128, longitude: -74.0060 
    },
    description: "Healthy and delicious vegetarian options.",
    cuisineType: "Vegetarian",
    rating: 4.3
    // priceRange is optional, so it can be omitted
  },
  {
    id: "p2",
    name: "Riverside Gardens",
    type: "park",
    location: {
      // Example with only lat/lon, other address parts optional
      city: "Metropolis", state: "NY", // Still good to have some readable parts
      latitude: 40.7796, longitude: -73.9632
    },
    description: "Beautiful botanical gardens along the river.",
    parkType: "Botanical Garden",
    amenities: ["river view", "benches"],
    rating: 4.7
  }
];

const mockFetchLocalItems = (): Promise<LocalItem[]> => {
  console.log("App.tsx: Using MOCK fetchLocalItems with MERGED types");
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // To test success (CURRENT STATE for development):
      resolve(mockLocalItems);

      // To test error state (uncomment one of these and comment out resolve(mockLocalItems)):
      // reject(new Error("Mock API fetch failed deliberately!"));

      // To test empty state (uncomment this and comment out the others):
      // resolve([]);
    }, 1000); // Simulate network delay
  });
};
// --- END OF MOCK DATA AND FUNCTION ---

function App() {
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [searchTerm, setSearchTerm] = useState<string>(''); // For C-Task 4 (Filtering)

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors on new fetch attempt
      try {
        // WHEN B-TASK 5 (frontend service layer) IS READY, YOU WILL REPLACE THIS:
        // import { fetchLocalItems } from './services/localItemService';
        // const data = await fetchLocalItems();
        const data = await mockFetchLocalItems(); // Using mock for now

        setLocalItems(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching items.');
        }
        setLocalItems([]); // Optionally clear items on error, or leave them as they were
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []); // Empty dependency array ensures this runs once on component mount

  // --- This will be replaced by filteredItems once filtering (C-Task 4) is implemented ---
  // For now, App.tsx directly manages and passes the 'localItems' to be rendered.
  // When filtering is added, we'll have:
  // const filteredLocalItems = useMemo(() => { ...filter logic... }, [localItems, searchTerm]);
  // And then the map below will use 'filteredLocalItems'.

  // --- Conditional Rendering Logic (C-Task 2) ---
  let contentToRender;

  if (isLoading) {
    contentToRender = <p>Loading local items...</p>;
  } else if (error) {
    contentToRender = <p style={{ color: 'red' }}>Error: {error}</p>;
  } else if (localItems.length === 0) { 
    // This covers both initial empty fetch and potentially if filtering (later) results in empty
    // A more specific message for "no results for your search" will be added with filtering.
    contentToRender = <p>No local items available at the moment.</p>;
  } else {
    // Data loaded successfully and there are items to display.
    contentToRender = (
      <div>
        {localItems.map(item => ( // Will change to filteredLocalItems later
          <LocalItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="App"> {/* Optional: for App-level styling via App.css */}
      <h1>Local Information Viewer</h1>
      
      {/* Search input and filtering logic will be added here in C-Task 4 / Prompt 10 & 11 */}
      {/* Example placeholder for search input:
        { !isLoading && !error && (localItems.length > 0 || (searchTerm && searchTerm.length > 0) ) && (
            <div style={{ margin: '20px 0' }}>
              <input
                type="text"
                placeholder="Search local items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px', width: 'calc(100% - 22px)', boxSizing: 'border-box', fontSize: '1em' }}
              />
            </div>
        )}
      */}

      <div className="items-list-container"> {/* Optional: for styling the list area */}
        {contentToRender}
      </div>
    </div>
  );
}

export default App;