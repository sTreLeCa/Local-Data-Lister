// backend/src/services/dataTransformer.ts
import { LocalItem, Restaurant, Park, Event, Location as LocalItemLocation } from '@local-data/types';
import { FoursquarePlace, FoursquareSearchResponse } from './foursquareService';

// Category IDs from Foursquare. You can find more here: https://location.foursquare.com/developer/reference/place-categories
const FOOD_RELATED_IDS = [
  13000, // All food
];

const PARK_RELATED_IDS = [
  16032, // Park
  16019, // Garden
  16009, // Dog Park
  16033, // Playground
  16003, // Beach
];

const EVENT_VENUE_IDS = [
  10027, // Music Venue
  10005, // Concert Hall
  10055, // Stadium
  10009, // Comedy Club
  10032, // Nightclub
];

// Define the photo type explicitly to avoid TypeScript inference issues
interface FoursquarePhoto {
  prefix: string;
  suffix: string;
}

/**
 * Transforms Foursquare location data into our LocalItem location format.
 * @param place - The Foursquare place object containing location data
 * @returns A LocalItemLocation object with standardized location fields
 */
const transformFoursquareLocation = (place: FoursquarePlace): LocalItemLocation => {
  return {
    latitude: place.geocodes.main.latitude,
    longitude: place.geocodes.main.longitude,
    street: place.location.address,
    city: place.location.locality,
    state: place.location.region,
    zipcode: place.location.postcode,
  };
};

/**
 * Determines the type of LocalItem based on Foursquare category IDs.
 * 
 * This function uses Foursquare's hierarchical category system to classify places.
 * Category IDs are hierarchical (e.g., 13065 (Italian Restaurant) is under 13000 (Food)).
 * 
 * @param place - The Foursquare place object containing category data
 * @returns Object containing the determined type and primary category name
 */
function getFoursquareCategoryType(place: FoursquarePlace): { 
  type: 'Restaurant' | 'Park' | 'Event' | 'Unknown', 
  primaryCategory?: string 
} {
  if (!place.categories || place.categories.length === 0) {
    return { type: 'Unknown' };
  }

  // Check if any place category ID or its parent falls into our defined types
  // Foursquare category IDs are hierarchical (e.g., 13065 (Italian Restaurant) is under 13000 (Food))
  for (const cat of place.categories) {
    const rootId = Math.floor(cat.id / 1000) * 1000; // e.g., 13065 -> 13000

    if (EVENT_VENUE_IDS.includes(cat.id) || EVENT_VENUE_IDS.includes(rootId)) {
      return { type: 'Event', primaryCategory: cat.name };
    }
    if (PARK_RELATED_IDS.includes(cat.id) || PARK_RELATED_IDS.includes(rootId)) {
      return { type: 'Park', primaryCategory: cat.name };
    }
    if (FOOD_RELATED_IDS.includes(cat.id) || FOOD_RELATED_IDS.includes(rootId)) {
      return { type: 'Restaurant', primaryCategory: cat.name };
    }
  }

  return { type: 'Unknown' };
}

/**
 * Constructs a full image URL from Foursquare photo data.
 * 
 * @param photo - The Foursquare photo object
 * @param size - The desired image size (default: 'original')
 * @returns Full image URL or undefined if no photo provided
 */
function constructImageUrl(photo: FoursquarePhoto, size: string = 'original'): string | undefined {
  if (!photo) return undefined;
  return `${photo.prefix}${size}${photo.suffix}`;
}

/**
 * Transforms a single FoursquarePlace object into a LocalItem object.
 * 
 * This function handles the conversion from Foursquare's place data structure to our standardized
 * LocalItem format. It performs type classification and enriches the data with type-specific fields.
 * 
 * @param place - The raw place object from Foursquare API response
 * @returns A LocalItem object (Restaurant, Park, or Event) or null if transformation fails
 * 
 * @limitations
 * - Places with unrecognized categories are filtered out (returns null)
 * - Event dates are placeholders since Foursquare doesn't provide event scheduling
 * - Foursquare rating is scaled from 10 to 5 for consistency with other APIs
 * 
 * @example
 * ```typescript
 * const foursquarePlace = { name: "Joe's Pizza", categories: [{ id: 13065, name: "Italian Restaurant" }], ... };
 * const localItem = transformFoursquarePlaceToLocalItem(foursquarePlace);
 * // Returns a Restaurant object with cuisineType: "Italian Restaurant"
 * ```
 */
export const transformFoursquarePlaceToLocalItem = (place: FoursquarePlace): LocalItem | null => {
  const { type, primaryCategory } = getFoursquareCategoryType(place);
  
  if (type === 'Unknown') {
    const categoryNames = place.categories?.map(c => c.name) || ['No categories'];
    console.warn(`Could not determine type for Foursquare place: ${place.name} with categories: ${JSON.stringify(categoryNames)}`);
    return null;
  }

  // Foursquare rating is out of 10, scale it to 5
  const rating = place.rating ? parseFloat((place.rating / 2).toFixed(1)) : undefined;

  // Build the base LocalItem data structure
  const baseItemData = {
    id: place.fsq_id,
    apiSpecificId: place.fsq_id,
    sourceApi: 'foursquare' as const,
    name: place.name,
    description: place.description || place.categories.map(c => c.name).join(', '),
    location: transformFoursquareLocation(place),
    rating: rating,
    website: place.website,
    imageUrl: place.photos && place.photos.length > 0 ? constructImageUrl(place.photos[0], '400x400') : undefined,
  };

  // Create type-specific LocalItem objects
  switch (type) {
    case 'Restaurant':
      // Map Foursquare price scale (1-4) to price range symbols
      const priceMap = { 
        1: '$' as const, 
        2: '$$' as const, 
        3: '$$$' as const, 
        4: '$$$$' as const 
      };
      return {
        ...baseItemData,
        type: 'Restaurant',
        cuisineType: primaryCategory || 'Restaurant',
        priceRange: place.price ? priceMap[place.price as keyof typeof priceMap] : undefined,
      } as Restaurant;

    case 'Park':
      return {
        ...baseItemData,
        type: 'Park',
        parkType: primaryCategory || 'Park',
        amenities: place.categories.map(c => c.name),
      } as Park;

    case 'Event':
      return {
        ...baseItemData,
        type: 'Event',
        eventType: primaryCategory || 'Event Venue',
        // LIMITATION: Foursquare doesn't provide event dates, so we use a placeholder
        startDate: new Date().toISOString(),
      } as Event;

    default:
      // TypeScript exhaustiveness check - this should never be reached
      const _exhaustiveCheck: never = type;
      console.error('Reached default case in item transformation switch, should not happen:', _exhaustiveCheck);
      return null;
  }
};

/**
 * Transforms a Foursquare API search response (containing multiple places) into an array of LocalItem objects.
 * 
 * This function processes the entire results array from a Foursquare search response,
 * filtering out places that cannot be transformed (unrecognized types, etc.).
 * 
 * @param foursquareResponse - The raw search response from Foursquare API, or null/undefined if request failed
 * @returns An array of LocalItem objects (may be empty if no places could be transformed)
 * 
 * @example
 * ```typescript
 * const foursquareResponse = await searchFoursquare({ near: "NYC", query: "restaurants" });
 * const localItems = transformFoursquareResponseToLocalItems(foursquareResponse);
 * console.log(`Transformed ${localItems.length} places`);
 * ```
 */
export const transformFoursquareResponseToLocalItems = (foursquareResponse: FoursquareSearchResponse | null | undefined): LocalItem[] => {
  // Handle null/undefined responses gracefully
  if (!foursquareResponse || !foursquareResponse.results) {
    return [];
  }
  
  return foursquareResponse.results
    .map(transformFoursquarePlaceToLocalItem)
    .filter((item): item is LocalItem => item !== null);
};