// backend/src/services/__test__/dataTransformer.test.ts
import { transformYelpBusinessToLocalItem, transformYelpResponseToLocalItems } from '../dataTransformer';
import { YelpBusiness } from '../yelpService'; // Assuming YelpBusiness is exported
import { LocalItem, Restaurant, Park, Event } from '@local-data/types';
import { describe, it, expect } from '@jest/globals';

// Mock data (mockYelpRestaurant, mockYelpPark, mockYelpEventVenue) remains the same as your last provided version.
// Ensure your YelpBusiness interface in yelpService.ts allows null for optional fields used in mocks.
// For example, mockYelpPark has `price: undefined`, so YelpBusiness.price should be `price?: string;`
// And minimalBusiness has `image_url: null`, `location.address1: null` etc. so those fields
// in YelpBusiness should be `string | null`.

// Mock a YelpBusiness object for a restaurant
const mockYelpRestaurant: YelpBusiness = {
  id: 'yelp-resto-123',
  alias: 'super-pizza-place-san-francisco',
  name: 'Super Pizza Place',
  image_url: 'http://s3-media1.fl.yelpcdn.com/bphoto/example.jpg',
  is_closed: false,
  url: 'https://www.yelp.com/biz/super-pizza-place-san-francisco',
  review_count: 100,
  categories: [
    { alias: 'pizza', title: 'Pizza' },
    { alias: 'italian', title: 'Italian' },
  ],
  rating: 4.5,
  coordinates: { latitude: 37.7749, longitude: -122.4194 },
  transactions: ['pickup', 'delivery'],
  price: '$$',
  location: {
    address1: '123 Main St',
    address2: null,
    address3: null,
    city: 'San Francisco',
    zip_code: '94107',
    country: 'US',
    state: 'CA',
    display_address: ['123 Main St', 'San Francisco, CA 94107'],
  },
  phone: '+14155551212',
  display_phone: '(415) 555-1212',
};

// Mock a YelpBusiness object for a park
const mockYelpPark: YelpBusiness = {
  id: 'yelp-park-456',
  alias: 'city-green-park-san-francisco',
  name: 'City Green Park',
  image_url: 'http://s3-media2.fl.yelpcdn.com/bphoto/example_park.jpg',
  is_closed: false,
  url: 'https://www.yelp.com/biz/city-green-park-san-francisco',
  review_count: 50,
  categories: [
    { alias: 'parks', title: 'Parks' },
    { alias: 'playgrounds', title: 'Playgrounds' },
  ],
  rating: 4.0, // Assuming rating can be number | null in YelpBusiness
  coordinates: { latitude: 37.7750, longitude: -122.4190 },
  transactions: [],
  price: undefined, // Parks typically don't have a Yelp price tier; YelpBusiness.price must be optional
  location: {
    address1: '456 Park Ave',
    address2: null,
    address3: null,
    city: 'San Francisco',
    zip_code: '94108',
    country: 'US',
    state: 'CA', // Assuming state is string | null in YelpBusiness if it can be null
    display_address: ['456 Park Ave', 'San Francisco, CA 94108'],
  },
  phone: '+14155551213', // Assuming phone is string | null in YelpBusiness
  display_phone: '(415) 555-1213', // Assuming display_phone is string | null
};

// Mock YelpBusiness for an "Event Venue"
const mockYelpEventVenue: YelpBusiness = {
  id: 'yelp-event-venue-789',
  alias: 'music-hall-sf',
  name: 'The Music Hall',
  image_url: 'http://s3-media3.fl.yelpcdn.com/bphoto/example_event.jpg',
  is_closed: false,
  url: 'https://www.yelp.com/biz/music-hall-sf',
  review_count: 200,
  categories: [
    { alias: 'musicvenues', title: 'Music Venues' },
    { alias: 'concerts', title: 'Concerts'}
  ],
  rating: 4.2, // Assuming rating can be number | null
  coordinates: { latitude: 37.7800, longitude: -122.4200 },
  transactions: ['ticket_sales'],
  price: '$$$', // Event venues can have price tiers; YelpBusiness.price must be optional
  location: {
    address1: '789 Stage Rd',
    address2: null,
    address3: null,
    city: 'San Francisco',
    zip_code: '94102',
    country: 'US',
    state: 'CA', // Assuming state is string | null
    display_address: ['789 Stage Rd', 'San Francisco, CA 94102'],
  },
  phone: '+14155551214', // Assuming phone is string | null
  display_phone: '(415) 555-1214', // Assuming display_phone is string | null
};


describe('transformYelpBusinessToLocalItem', () => {
  it('should transform a Yelp restaurant business to a LocalItem Restaurant', () => {
    const result = transformYelpBusinessToLocalItem(mockYelpRestaurant);
    expect(result).not.toBeNull();
    if (!result || result.type !== 'Restaurant') throw new Error("Test failed: Expected a Restaurant item.");

    // result is now known to be Restaurant
    expect(result.type).toBe('Restaurant');
    expect(result.id).toBe(mockYelpRestaurant.id);
    expect(result.apiSpecificId).toBe(mockYelpRestaurant.id);
    expect(result.sourceApi).toBe('yelp');
    expect(result.name).toBe('Super Pizza Place');
    expect(result.location.latitude).toBe(37.7749);
    expect(result.location.longitude).toBe(-122.4194);
    expect(result.location.street).toBe('123 Main St');
    expect(result.location.city).toBe('San Francisco');
    expect(result.location.state).toBe('CA');
    expect(result.location.zipcode).toBe('94107');
    expect(result.cuisineType).toBe('Pizza'); // Adjust if your logic picks "Italian" or another title
    expect(result.priceRange).toBe('$$'); // Accessing priceRange is safe here
    expect(result.rating).toBe(4.5);
    expect(result.imageUrl).toBe(mockYelpRestaurant.image_url);
    expect(result.website).toBe(mockYelpRestaurant.url);
  });

  it('should transform a Yelp park business to a LocalItem Park', () => {
    const result = transformYelpBusinessToLocalItem(mockYelpPark);
    expect(result).not.toBeNull();
    if (!result || result.type !== 'Park') throw new Error("Test failed: Expected a Park item.");

    // result is Park
    expect(result.type).toBe('Park');
    expect(result.id).toBe(mockYelpPark.id);
    expect(result.name).toBe('City Green Park');
    expect(result.parkType).toBe('Parks');
    expect(result.amenities).toEqual(expect.arrayContaining(['Parks', 'Playgrounds']));
    expect(result.location.city).toBe('San Francisco');
    expect(result.rating).toBe(4.0);
    expect(result.location.street).toBe('456 Park Ave');
  });

  it('should transform a Yelp music venue to a LocalItem Event', () => {
    const result = transformYelpBusinessToLocalItem(mockYelpEventVenue);
    expect(result).not.toBeNull();
    if (!result || result.type !== 'Event') throw new Error("Test failed: Expected an Event item.");
    
    // result is Event
    expect(result.type).toBe('Event');
    expect(result.id).toBe(mockYelpEventVenue.id);
    expect(result.name).toBe('The Music Hall');
    expect(result.eventType).toBe('Music Venues');
    expect(result.startDate).toBeDefined();
    expect(new Date(result.startDate).toISOString()).toEqual(result.startDate);
    expect(result.location.street).toBe('789 Stage Rd');
    // Note: An Event item does not have priceRange. Accessing it here would be an error.
  });

  it('should return null for a closed business', () => {
    const closedYelpBusiness = { ...mockYelpRestaurant, is_closed: true };
    const result = transformYelpBusinessToLocalItem(closedYelpBusiness);
    expect(result).toBeNull();
  });

  it('should return null if item type cannot be determined (e.g. unknown category)', () => {
    // UPDATED: Using a category alias that definitely won't match any of our predefined arrays
    // This ensures the stricter determineItemTypeAndSpecifics logic correctly identifies it as unknown
    const unknownCategoryBusiness: YelpBusiness = {
      ...mockYelpRestaurant,
      id: 'unknown-id-for-test', // ensure ID is different if it matters for other tests
      categories: [{ 
        alias: 'automotive_repair_shops', // This is a real Yelp category but not in our FOOD/PARK/EVENT arrays
        title: 'Auto Repair Shops' 
      }],
    };
    const result = transformYelpBusinessToLocalItem(unknownCategoryBusiness);
    expect(result).toBeNull();
  });

  it('should handle businesses with missing optional fields correctly', () => {
    const minimalBusiness: YelpBusiness = {
      ...mockYelpRestaurant, 
      // UPDATED: Explicitly override rating with null to test null handling
      rating: null,               // This now properly overrides the spread rating
      price: undefined,       
      image_url: null,        
      url: null,    // Test missing URL
      categories: [{alias: 'restaurants', title: 'Restaurants'}], 
      location: {
        ...mockYelpRestaurant.location, 
        address1: null,                 
        city: null,                     
        state: null,                    
        zip_code: null,                 
      },
    };
    const result = transformYelpBusinessToLocalItem(minimalBusiness);
    expect(result).not.toBeNull(); 
    
    if (result) {
      // Common properties
      expect(result.imageUrl).toBeNull();       
      expect(result.location.street).toBeUndefined(); 
      expect(result.location.city).toBeUndefined();    
      expect(result.location.state).toBeUndefined();   
      expect(result.location.zipcode).toBeUndefined(); 
      expect(result.rating).toBeNull(); // This should now correctly be null
      expect(result.website).toBeNull();

      // Restaurant-specific property
      if (result.type === 'Restaurant') {
        expect(result.priceRange).toBeUndefined(); 
      } else {
        // If it somehow wasn't a restaurant, this test part for priceRange might be problematic
        // However, with categories: [{alias: 'restaurants', ...}], it should be a restaurant.
        // To be absolutely safe, one might even expect(result.type).toBe('Restaurant'); first.
      }
    }
  });
});

describe('transformYelpResponseToLocalItems', () => {
  it('should transform a list of Yelp businesses, filtering closed ones', () => {
    const yelpResponseMock = { // Mock only needs 'businesses' property
      businesses: [mockYelpRestaurant, mockYelpPark, { ...mockYelpRestaurant, id: 'closed-resto', is_closed: true }],
    };
    const results = transformYelpResponseToLocalItems(yelpResponseMock);
    expect(results).toHaveLength(2);
    expect(results.map(r => r.id)).toEqual(['yelp-resto-123', 'yelp-park-456']);
    expect(results[0].type).toBe('Restaurant');
    expect(results[1].type).toBe('Park');
  });

  it('should filter out businesses where type cannot be determined', () => {
    // UPDATED: Using a category that definitely won't match our predefined arrays
    const unknownCategoryBusiness: YelpBusiness = {
      ...mockYelpRestaurant, 
      id: 'unknown-biz-id',
      name: 'An Unknown Thing',
      categories: [{ 
        alias: 'automotive_dealerships', // Real Yelp category but not in our arrays
        title: 'Car Dealerships' 
      }],
    };
    
    const yelpResponseMock = { // Mock only needs 'businesses' property
      businesses: [mockYelpRestaurant, unknownCategoryBusiness, mockYelpPark],
    };
    const results = transformYelpResponseToLocalItems(yelpResponseMock);
    expect(results).toHaveLength(2);
    expect(results.map(r => r.id)).toEqual(['yelp-resto-123', 'yelp-park-456']);
  });

  it('should return an empty array if businesses array is empty or response is invalid', () => {
    expect(transformYelpResponseToLocalItems({ businesses: [] })).toEqual([]);
    
    expect(transformYelpResponseToLocalItems(null)).toEqual([]);
    
    expect(transformYelpResponseToLocalItems({} as any)).toEqual([]); // Cast to any to bypass TS check for test
    
    expect(transformYelpResponseToLocalItems(undefined)).toEqual([]);
  });

  it('should handle mixed identifiable business types correctly', () => {
    const yelpResponseMock = { // Mock only needs 'businesses' property
      businesses: [mockYelpRestaurant, mockYelpPark, mockYelpEventVenue],
    };
    const results = transformYelpResponseToLocalItems(yelpResponseMock);
    expect(results).toHaveLength(3);
    
    const types = results.map(r => r.type);
    expect(types).toContain('Restaurant');
    expect(types).toContain('Park');
    expect(types).toContain('Event');
  });
});