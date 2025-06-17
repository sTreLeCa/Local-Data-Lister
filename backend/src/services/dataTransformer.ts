// backend/src/services/dataTransformer.ts
import { LocalItem, Restaurant, Park, Event, Location as LocalItemLocation } from '@local-data/types';
import { YelpBusiness } from './yelpService';
// Removed YelpCategory import as YelpBusiness.categories directly defines the structure.
// Removed uuidv4 import as we are using Yelp's ID directly for LocalItem's id for simplicity.
// If you need unique IDs separate from Yelp's, you can re-add: import { v4 as uuidv4 } from 'uuid';

/**
 * Transforms Yelp location data into our LocalItem location format.
 * @param yelpBusiness - The Yelp business object containing location data
 * @returns A LocalItemLocation object with standardized location fields
 */
const transformYelpLocation = (yelpBusiness: YelpBusiness): LocalItemLocation => {
  const { coordinates, location: yelpLocation } = yelpBusiness;
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    street: yelpLocation.address1 || undefined,
    city: yelpLocation.city || undefined,
    state: yelpLocation.state || undefined,
    zipcode: yelpLocation.zip_code || undefined,
  };
};

/**
 * Food-related category aliases for classification.
 * 
 * NOTE: This list may need expansion for better coverage of food establishments.
 * For a comprehensive list of Yelp categories, refer to:
 * https://docs.developer.yelp.com/docs/resources-category-list
 * 
 * Consider adding more specific cuisines and food types as needed for your use case.
 */
const FOOD_RELATED_ALIASES = [
  'restaurants', 'food', 'bars', 'cafes', 'bakeries', 'desserts', 'pubs',
  'pizza', 'italian', 'mexican', 'chinese', 'japanese', 'sushi', 'thai', 'indian',
  'burgers', 'sandwiches', 'icecream', 'donuts', 'coffee', 'tea',
  'bagels', 'belgian', 'brasseries', 'breakfast_brunch', 'buffets', 'caribbean',
  'diners', 'delis', 'fastfood', 'fishnchips', 'french', 'german', 'gluten_free',
  'greek', 'halal', 'hawaiian', 'korean', 'mediterranean', 'noodles', 'pancakes',
  'salad', 'seafood', 'soulfood', 'soup', 'spanish', 'steak', 'tapas', 'vegan',
  'vegetarian', 'vietnamese', 'wraps'
];

/**
 * Park and outdoor recreation-related category aliases for classification.
 * 
 * NOTE: This list may need expansion to cover more outdoor recreation venues.
 * Consider adding regional or specialized park types based on your target locations.
 * Refer to Yelp's category documentation for additional outdoor/recreation categories.
 */
const PARK_RELATED_ALIASES = [
  'parks', 'gardens', 'beaches', 'playgrounds', 'dogparks', 'hiking', 'naturecenters',
  'lakes', 'picnicsites', 'skate_parks', 'zoos', 'botanical_gardens', 'arboretums'
];

/**
 * Event venue and entertainment-related category aliases for classification.
 * 
 * NOTE: This list focuses on venues that host events rather than specific events.
 * Consider expanding to include more entertainment venues, cultural centers, etc.
 * Some categories like 'wineries' and 'breweries' are included as they often host events.
 */
const EVENT_VENUE_RELATED_ALIASES = [
  'eventvenues', 'musicvenues', 'stadiumsarenas', 'theater', 'galleries', 'movietheaters',
  'comedyclubs', 'danceclubs', 'festivals', 'venues', 'eventplanning', 'partybusrentals',
  'performingarts', 'social_clubs', 'wineries', 'breweries' // Wineries/Breweries can host events
];

/**
 * Determines the type of LocalItem and extracts type-specific data based on Yelp categories.
 * 
 * This function uses exact alias matching to classify businesses into Restaurant, Park, Event, or Unknown types.
 * The classification is hierarchical: Event venues are checked first, then Parks, then Restaurants.
 * 
 * @param yelpCategories - Array of category objects from Yelp business data (may be undefined)
 * @returns Object containing the determined type and type-specific data
 * 
 * @limitations
 * - Event startDate is set to current date as a placeholder since Yelp doesn't provide event scheduling data
 * - Classification depends on predefined alias lists which may not cover all possible Yelp categories
 * - Unknown type is returned when no matching categories are found
 */
const determineItemTypeAndSpecifics = (
  yelpCategories: YelpBusiness['categories'] | undefined
): { type: 'Restaurant' | 'Park' | 'Event' | 'Unknown'; specifics: Partial<Restaurant | Park | Event> } => {
  if (!yelpCategories || yelpCategories.length === 0) {
    return { type: 'Unknown', specifics: {} };
  }

  const aliases = yelpCategories.map(category => category.alias.toLowerCase());
  const titles = yelpCategories.map(category => category.title);

  // Check for Event Venues first (highest priority)
  if (aliases.some(alias => EVENT_VENUE_RELATED_ALIASES.includes(alias))) {
    const matchingEventTitle = titles.find((title, index) => 
      EVENT_VENUE_RELATED_ALIASES.includes(aliases[index])
    );
    return {
      type: 'Event',
      specifics: {
        eventType: matchingEventTitle || titles[0] || 'General Event Venue',
        // LIMITATION: startDate is a placeholder - real events need specific scheduling data
        startDate: new Date().toISOString(),
      },
    };
  }

  // Check for Parks and outdoor recreation venues
  if (aliases.some(alias => PARK_RELATED_ALIASES.includes(alias))) {
    const matchingParkTitle = titles.find((title, index) => 
      PARK_RELATED_ALIASES.includes(aliases[index])
    );
    return {
      type: 'Park',
      specifics: {
        parkType: matchingParkTitle || titles[0] || 'General Park',
        // Only include amenities that have exact alias matches
        amenities: titles.filter((title, index) => 
          PARK_RELATED_ALIASES.includes(aliases[index])
        ),
      },
    };
  }

  // Check for Restaurants and food establishments
  if (aliases.some(alias => FOOD_RELATED_ALIASES.includes(alias))) {
    const matchingFoodTitles = titles.filter((title, index) => 
      FOOD_RELATED_ALIASES.includes(aliases[index])
    );
    
    // Prefer specific cuisine types over generic food categories
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

/**
 * Transforms a single YelpBusiness object into a LocalItem object.
 * 
 * This function handles the conversion from Yelp's business data structure to our standardized
 * LocalItem format. It performs type classification and enriches the data with type-specific fields.
 * 
 * @param yelpBusiness - The raw business object from Yelp API response
 * @returns A LocalItem object (Restaurant, Park, or Event) or null if transformation fails
 * 
 * @limitations
 * - Closed businesses are filtered out (returns null)
 * - Businesses with unrecognized categories are filtered out (returns null)
 * - Event dates are placeholders since Yelp doesn't provide event scheduling
 * - Price range mapping assumes Yelp's price format matches LocalItem's PriceRange type
 * 
 * @example
 * ```typescript
 * const yelpBusiness = { name: "Joe's Pizza", categories: [{ alias: "pizza", title: "Pizza" }], ... };
 * const localItem = transformYelpBusinessToLocalItem(yelpBusiness);
 * // Returns a Restaurant object with cuisineType: "Pizza"
 * ```
 */
export const transformYelpBusinessToLocalItem = (yelpBusiness: YelpBusiness): LocalItem | null => {
  // Skip permanently closed businesses
  if (yelpBusiness.is_closed) {
    return null;
  }

  // Determine the type and extract type-specific data
  const { type: itemType, specifics: typeSpecifics } = determineItemTypeAndSpecifics(yelpBusiness.categories);

  // Filter out businesses that don't match our supported types
  if (itemType === 'Unknown') {
    const categoryAliases = yelpBusiness.categories 
      ? yelpBusiness.categories.map(category => category.alias) 
      : ['No categories'];
    console.warn(`Could not determine type for Yelp business: ${yelpBusiness.name} with categories: ${JSON.stringify(categoryAliases)}`);
    return null;
  }

  // Build the base LocalItem data structure
  const baseItemData = {
    id: yelpBusiness.id, // Using Yelp's ID as our primary ID
    name: yelpBusiness.name,
    description: yelpBusiness.categories?.map(category => category.title).join(', ') || 'No specific description available.',
    location: transformYelpLocation(yelpBusiness),
    rating: yelpBusiness.rating,
    imageUrl: yelpBusiness.image_url,
    website: yelpBusiness.url,
    sourceApi: 'yelp',
    apiSpecificId: yelpBusiness.id,
  };

  // Create type-specific LocalItem objects
  switch (itemType) {
    case 'Restaurant':
      const defaultCuisine = yelpBusiness.categories && yelpBusiness.categories.length > 0 
        ? yelpBusiness.categories[0].title 
        : 'Not specified';
      return {
        ...baseItemData,
        type: 'Restaurant',
        cuisineType: (typeSpecifics as Partial<Restaurant>).cuisineType || defaultCuisine,
        priceRange: yelpBusiness.price as Restaurant['priceRange'],
        ...typeSpecifics,
      } as Restaurant;

    case 'Park':
      const defaultParkType = yelpBusiness.categories && yelpBusiness.categories.length > 0 
        ? yelpBusiness.categories[0].title 
        : 'Not specified';
      const parkAmenities = yelpBusiness.categories 
        ? yelpBusiness.categories.map(category => category.title) 
        : [];
      return {
        ...baseItemData,
        type: 'Park',
        parkType: (typeSpecifics as Partial<Park>).parkType || defaultParkType,
        amenities: (typeSpecifics as Partial<Park>).amenities || parkAmenities,
        ...typeSpecifics,
      } as Park;

    case 'Event':
      const defaultEventType = yelpBusiness.categories && yelpBusiness.categories.length > 0 
        ? yelpBusiness.categories[0].title 
        : 'Not specified';
      return {
        ...baseItemData,
        type: 'Event',
        eventType: (typeSpecifics as Partial<Event>).eventType || defaultEventType,
        // LIMITATION: Placeholder date since Yelp doesn't provide event scheduling
        startDate: (typeSpecifics as Partial<Event>).startDate || new Date().toISOString(),
        ...typeSpecifics,
      } as Event;

    default:
      // TypeScript exhaustiveness check - this should never be reached
      const _exhaustiveCheck: never = itemType;
      console.error('Reached default case in item transformation switch, should not happen:', _exhaustiveCheck);
      return null;
  }
};

/**
 * Transforms a Yelp API search response (containing multiple businesses) into an array of LocalItem objects.
 * 
 * This function processes the entire businesses array from a Yelp search response,
 * filtering out businesses that cannot be transformed (closed businesses, unrecognized types, etc.).
 * 
 * @param yelpResponse - The raw search response from Yelp API, or null/undefined if request failed
 * @returns An array of LocalItem objects (may be empty if no businesses could be transformed)
 * 
 * @example
 * ```typescript
 * const yelpResponse = await searchYelp({ location: "NYC", term: "restaurants" });
 * const localItems = transformYelpResponseToLocalItems(yelpResponse);
 * console.log(`Transformed ${localItems.length} businesses`);
 * ```
 */
export const transformYelpResponseToLocalItems = (yelpResponse: { businesses: YelpBusiness[] } | null | undefined): LocalItem[] => {
  // Handle null/undefined responses gracefully
  if (!yelpResponse || !yelpResponse.businesses) {
    return [];
  }
  
  return yelpResponse.businesses
    .map(transformYelpBusinessToLocalItem)
    .filter((item): item is LocalItem => item !== null);
};