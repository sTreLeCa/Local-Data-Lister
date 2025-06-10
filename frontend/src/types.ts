export interface Location {
  street: string;
  city: string;
  state: string;
}

export interface BaseItem {
  id: string;
  name: string;
  location: Location;
  description: string;
  type: 'restaurant' | 'event' | 'park'; // Using string literal union for the discriminator
}

export interface Restaurant extends BaseItem {
  type: "restaurant";
  cuisineType: string;
  priceRange?: string;
  rating?: number;
}

export interface EventItem extends BaseItem {
  type: "event";
  eventType: string;
  eventDate?: string;
}

export interface Park extends BaseItem {
  type: "park";
  parkType: string;
  amenities?: string[];
}

export type LocalItem = Restaurant | EventItem | Park;