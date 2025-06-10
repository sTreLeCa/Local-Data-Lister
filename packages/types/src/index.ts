export interface Location {
  street?: string;          // Optional: For human-readable display
  city?: string;            // Optional: For human-readable display
  state?: string;           // Optional: For human-readable display
  zipcode?: string;         // Optional
  latitude: number;         // Core: For mapping & API use
  longitude: number;        // Core: For mapping & API use
}

// Base interface with common fields for all local items
export interface BaseItem {
  id: string;
  name: string;
  description: string;
  location: Location;
  rating?: number; // A number from 1 to 5, optional as not all items might have ratings
  type: 'restaurant' | 'event' | 'park'; // Discriminator - CRUCIAL FOR TYPE NARROWING
}

// Specific item types that extend the BaseItem

export interface Restaurant extends BaseItem {
  type: 'restaurant'; // Discriminator
  cuisineType: string;  // From our original spec - e.g., "Italian", "Mexican"
  priceRange?: string;   // e.g., "$", "$$", "$$$" - Optional
  // 'rating' is inherited from BaseItem and is optional there
}

export interface EventItem extends BaseItem {
  type: 'event'; // Discriminator
  eventType: string;     // From our original spec - e.g., "Music Festival", "Sports Game"
  eventDate: string;     // ISO 8601 date string (e.g., "2024-12-25T18:00:00Z") or "YYYY-MM-DD"
  price?: number;        // Price in USD, 0 for free events - Optional
}

export interface Park extends BaseItem {
  type: 'park'; // Discriminator
  parkType: string;      // From our original spec - e.g., "National Park", "City Park"
  amenities?: string[];  // e.g., ["playground", "picnic tables", "lake"] - Optional
}

// Discriminated union type for any possible local item
export type LocalItem = Restaurant | EventItem | Park;