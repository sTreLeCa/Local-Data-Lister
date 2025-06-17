// backend/src/services/dataTransformer.ts
import { LocalItem, Restaurant, Park, Event, Location as LocalItemLocation } from '@local-data/types';
import { YelpBusiness } from './yelpService';
// Removed YelpCategory import as YelpBusiness.categories directly defines the structure.
// Removed uuidv4 import as we are using Yelp's ID directly for LocalItem's id for simplicity.
// If you need unique IDs separate from Yelp's, you can re-add: import { v4 as uuidv4 } from 'uuid';

// Helper to attempt to parse Yelp location data
const transformYelpLocation = (yelpBusiness: YelpBusiness): LocalItemLocation => {
  const { coordinates, location: yelpLoc } = yelpBusiness;
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    street: yelpLoc.address1 || undefined,
    city: yelpLoc.city || undefined,
    state: yelpLoc.state || undefined,
    zipcode: yelpLoc.zip_code || undefined,
  };
};

// --- UPDATED/IMPROVED determineItemTypeAndSpecifics ---
const FOOD_RELATED_ALIASES = [
  'restaurants', 'food', 'bars', 'cafes', 'bakeries', 'desserts', 'pubs',
  'pizza', 'italian', 'mexican', 'chinese', 'japanese', 'sushi', 'thai', 'indian',
  'burgers', 'sandwiches', 'icecream', 'donuts', 'coffee', 'tea',
  // You can get a comprehensive list from Yelp's API documentation for categories
  // e.g., https://docs.developer.yelp.com/docs/resources-category-list
  // Search for "food" or "restaurants" and see their child categories.
  'bagels', 'belgian', 'brasseries', 'breakfast_brunch', 'buffets', 'caribbean',
  'diners', 'delis', 'fastfood', 'fishnchips', 'french', 'german', 'gluten_free',
  'greek', 'halal', 'hawaiian', 'korean', 'mediterranean', 'noodles', 'pancakes',
  'salad', 'seafood', 'soulfood', 'soup', 'spanish', 'steak', 'tapas', 'vegan',
  'vegetarian', 'vietnamese', 'wraps'
];

const PARK_RELATED_ALIASES = [
  'parks', 'gardens', 'beaches', 'playgrounds', 'dogparks', 'hiking', 'naturecenters',
  'lakes', 'picnicsites', 'skate_parks', 'zoos', 'botanical_gardens', 'arboretums'
];

const EVENT_VENUE_RELATED_ALIASES = [
  'eventvenues', 'musicvenues', 'stadiumsarenas', 'theater', 'galleries', 'movietheaters',
  'comedyclubs', 'danceclubs', 'festivals', 'venues', 'eventplanning', 'partybusrentals',
  'performingarts', 'social_clubs', 'wineries', 'breweries' // Wineries/Breweries can host events
];

const determineItemTypeAndSpecifics = (
  yelpCategories: YelpBusiness['categories'] | undefined // Make it possibly undefined
): { type: 'Restaurant' | 'Park' | 'Event' | 'Unknown'; specifics: Partial<Restaurant | Park | Event> } => {
  if (!yelpCategories || yelpCategories.length === 0) {
    return { type: 'Unknown', specifics: {} };
  }

  const aliases = yelpCategories.map(cat => cat.alias.toLowerCase());
  const titles = yelpCategories.map(cat => cat.title);

  // STRICTER VERSION: Check for exact matches in alias arrays
  
  // Check for Event Venues - exact match required
  if (aliases.some(alias => EVENT_VENUE_RELATED_ALIASES.includes(alias))) {
    const matchingEventTitle = titles.find((title, index) => 
      EVENT_VENUE_RELATED_ALIASES.includes(aliases[index])
    );
    return {
      type: 'Event',
      specifics: {
        eventType: matchingEventTitle || titles[0] || 'General Event Venue',
        startDate: new Date().toISOString(), // Placeholder - real events need specific dates
      },
    };
  }

  // Check for Parks - exact match required
  if (aliases.some(alias => PARK_RELATED_ALIASES.includes(alias))) {
    const matchingParkTitle = titles.find((title, index) => 
      PARK_RELATED_ALIASES.includes(aliases[index])
    );
    return {
      type: 'Park',
      specifics: {
        parkType: matchingParkTitle || titles[0] || 'General Park',
        amenities: titles.filter((title, index) => 
          PARK_RELATED_ALIASES.includes(aliases[index])
        ), // Only include titles that have exact alias matches
      },
    };
  }

  // Check for Restaurants/Food - exact match required
  if (aliases.some(alias => FOOD_RELATED_ALIASES.includes(alias))) {
    // Find the primary cuisine based on exact alias match, preferring more specific cuisines
    const matchingFoodTitles = titles.filter((title, index) => 
      FOOD_RELATED_ALIASES.includes(aliases[index])
    );
    
    // Prefer specific cuisine types over generic ones
    const specificCuisines = matchingFoodTitles.filter(title => 
      !['Food', 'Restaurants', 'Bars', 'Cafes', 'Pubs'].includes(title)
    );
    
    const primaryCuisine = specificCuisines.length > 0 
      ? specificCuisines[0] 
      : matchingFoodTitles[0] || titles[0];

    return {
      type: 'Restaurant',
      specifics: {
        cuisineType: primaryCuisine || 'Various',
      },
    };
  }
  
  return { type: 'Unknown', specifics: {} };
};
// --- END OF UPDATED determineItemTypeAndSpecifics ---

export const transformYelpBusinessToLocalItem = (yelpBusiness: YelpBusiness): LocalItem | null => {
  if (yelpBusiness.is_closed) {
    return null; // Skip closed businesses
  }

  // Pass yelpBusiness.categories, which might be undefined if YelpBusiness type allows it
  const { type: itemType, specifics: typeSpecifics } = determineItemTypeAndSpecifics(yelpBusiness.categories);

  if (itemType === 'Unknown') {
    const categoryAliases = yelpBusiness.categories ? yelpBusiness.categories.map(c => c.alias) : ['No categories'];
    console.warn(`Could not determine type for Yelp business: ${yelpBusiness.name} with categories: ${JSON.stringify(categoryAliases)}`);
    return null;
  }

  const baseItemData = {
    id: yelpBusiness.id, // Using Yelp's ID as our primary ID
    name: yelpBusiness.name,
    description: yelpBusiness.categories?.map(cat => cat.title).join(', ') || 'No specific description available.', // Handle potentially undefined categories
    location: transformYelpLocation(yelpBusiness),
    rating: yelpBusiness.rating, // Assuming rating in YelpBusiness can be number | null
    imageUrl: yelpBusiness.image_url, // Assuming image_url in YelpBusiness can be string | null
    website: yelpBusiness.url, // Assuming url in YelpBusiness can be string | null
    sourceApi: 'yelp',
    apiSpecificId: yelpBusiness.id,
  };

  switch (itemType) {
    case 'Restaurant':
      // Ensure categories is not undefined before accessing [0]
      const defaultCuisine = yelpBusiness.categories && yelpBusiness.categories.length > 0 ? yelpBusiness.categories[0].title : 'Not specified';
      return {
        ...baseItemData,
        type: 'Restaurant',
        cuisineType: (typeSpecifics as Partial<Restaurant>).cuisineType || defaultCuisine,
        priceRange: yelpBusiness.price as Restaurant['priceRange'], // Assumes yelpBusiness.price matches your PriceRange union
        ...typeSpecifics,
      } as Restaurant;
    case 'Park':
      const defaultParkType = yelpBusiness.categories && yelpBusiness.categories.length > 0 ? yelpBusiness.categories[0].title : 'Not specified';
      const parkAmenities = yelpBusiness.categories ? yelpBusiness.categories.map(c => c.title) : [];
      return {
        ...baseItemData,
        type: 'Park',
        parkType: (typeSpecifics as Partial<Park>).parkType || defaultParkType,
        amenities: (typeSpecifics as Partial<Park>).amenities || parkAmenities,
        ...typeSpecifics,
      } as Park;
    case 'Event':
      const defaultEventType = yelpBusiness.categories && yelpBusiness.categories.length > 0 ? yelpBusiness.categories[0].title : 'Not specified';
      return {
        ...baseItemData,
        type: 'Event',
        eventType: (typeSpecifics as Partial<Event>).eventType || defaultEventType,
        startDate: (typeSpecifics as Partial<Event>).startDate || new Date().toISOString(), // Placeholder
        ...typeSpecifics,
      } as Event;
    default:
      // This case should ideally not be reached if itemType !== 'Unknown' has been handled.
      // However, to satisfy TypeScript's exhaustiveness check if itemType could somehow be 'Unknown' here:
      const _exhaustiveCheck: never = itemType;
      console.error('Reached default case in item transformation switch, should not happen:', _exhaustiveCheck)
      return null;
  }
};

export const transformYelpResponseToLocalItems = (yelpResponse: { businesses: YelpBusiness[] } | null | undefined): LocalItem[] => {
  // Added null/undefined check for yelpResponse itself
  if (!yelpResponse || !yelpResponse.businesses) {
    return [];
  }
  return yelpResponse.businesses
    .map(transformYelpBusinessToLocalItem)
    .filter((item): item is LocalItem => item !== null);
};