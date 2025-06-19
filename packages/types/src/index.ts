// packages/types/src/index.ts

export interface Location {
  // Your existing Location is good and matches the requirements:
  // optional street/city/state, required lat/lon.
  // I'm adding 'address' as a more general field than 'street',
  // and keeping 'zipcode' as it's common.
  // You can decide if you prefer separate street/city/state or a single address line.
  // For now, let's keep your existing structure and add 'address' if desired.
  street?: string;          // Optional: For human-readable display
  city?: string;            // Optional: For human-readable display
  state?: string;           // Optional: For human-readable display
  zipcode?: string;         // Optional
  // address?: string; // Alternative or addition to street/city/state
  latitude: number;         // Core: For mapping & API use
  longitude: number;        // Core: For mapping & API use
}

// Renaming BaseItem to BaseLocalItem for clarity with the task description
export interface BaseLocalItem {
  id: string; // Unique identifier for your system
  name: string;
  description: string;
  location: Location;
  rating?: number; // A number from 1 to 5, optional

  // DISCRIMINATOR: Crucial for type narrowing
  type: 'Restaurant' | 'Event' | 'Park'; // Using PascalCase for type names as is common

  // NEW: Fields for external API integration (as per MERGED requirements)
  sourceApi?: string;     // e.g., "yelp", "google_places", "local_json"
  apiSpecificId?: string; // The ID from the source API (could be different from your 'id')
  imageUrl?: string;      // Optional image URL, often provided by APIs
  website?: string;       // Optional website URL
}

// Specific item types that extend the BaseLocalItem
// Using PascalCase for type names 'Restaurant', 'Event', 'Park'
// And for the 'type' literal to match

export interface Restaurant extends BaseLocalItem {
  type: 'Restaurant';     // Discriminator
  cuisineType: string;    // e.g., "Italian", "Mexican"
  priceRange?: '$' | '$$' | '$$$' | '$$$$'; // More standardized price range
  openingHours?: string; // Could be a string or a more structured object
}

export interface Event extends BaseLocalItem { // Renamed EventItem to Event for consistency
  type: 'Event';          // Discriminator
  eventType: string;      // e.g., "Music Festival", "Sports Game"
  // Using ISO 8601 for dates is best practice
  startDate: string;      // ISO 8601 date string (e.g., "2024-12-25T18:00:00Z")
  endDate?: string;       // ISO 8601 date string, optional
  organizer?: string;
  ticketPrice?: string | number; // e.g., "Free" or 25.00 (more flexible than just number)
}

export interface Park extends BaseLocalItem {
  type: 'Park';           // Discriminator
  parkType: string;       // e.g., "National Park", "City Park"
  features?: string[];    // Renamed 'amenities' to 'features' for parks, or keep 'amenities'
                          // 'amenities' is also fine and perhaps more common. Let's stick with your 'amenities'.
  amenities?: string[];   // e.g., ["playground", "picnic tables", "lake"] - Optional
  area?: string;          // e.g., "15 acres"
}

// Discriminated union type for any possible local item
// Using PascalCase for the type name 'LocalItem'
export type LocalItem = Restaurant | Event | Park;