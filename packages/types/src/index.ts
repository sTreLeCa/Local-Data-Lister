// A. Basic Location Type
export interface Location {
  latitude: number;
  longitude: number;
}

// B. Base interface with common fields for all local items
export interface BaseItem {
  id: string;
  name: string;
  description: string;
  location: Location;
  rating: number; // A number from 1 to 5
}

// C. Specific item types that extend the BaseItem

// A Restaurant has a specific cuisine type
export interface Restaurant extends BaseItem {
  type: 'restaurant';
  cuisine: string;
}

// An Event has a date and a ticket price
export interface EventItem extends BaseItem {
  type: 'event';
  date: string; // ISO 8601 date string (e.g., "2024-12-25T18:00:00Z")
  price: number; // Price in USD, 0 for free events
}

// A Park has a list of features
export interface Park extends BaseItem {
  type: 'park';
  features: string[]; // e.g., ["playground", "picnic tables", "lake"]
}

// D. A discriminated union type for any possible local item
// This allows us to have an array of different item types and
// still know exactly what fields are available on each one.
export type LocalItem = Restaurant | EventItem | Park;