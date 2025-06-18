// backend/src/services/__test__/dataTransformer.test.ts
import { transformFoursquarePlaceToLocalItem, transformFoursquareResponseToLocalItems } from '../dataTransformer';
import { FoursquarePlace, FoursquareSearchResponse } from '../foursquareService';
import { LocalItem, Restaurant, Park, Event } from '@local-data/types';
import { describe, it, expect } from '@jest/globals';

// Mock a FoursquarePlace object for a restaurant
const mockFoursquareRestaurant: FoursquarePlace = {
  fsq_id: 'foursquare-resto-123',
  name: 'Super Pizza Place',
  description: 'Authentic Italian pizza in the heart of the city',
  categories: [
    { 
      id: 13065, 
      name: 'Italian Restaurant',
      icon: {
        prefix: 'https://ss3.4sqi.net/img/categories_v2/food/italian_',
        suffix: '.png'
      }
    },
    { 
      id: 13064, 
      name: 'Pizza Place',
      icon: {
        prefix: 'https://ss3.4sqi.net/img/categories_v2/food/pizza_',
        suffix: '.png'
      }
    },
  ],
  rating: 9.0, // Foursquare uses 0-10 scale
  price: 2, // Foursquare price scale 1-4
  website: 'https://www.superpizzaplace.com',
  geocodes: {
    main: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
  location: {
    address: '123 Main St',
    locality: 'San Francisco',
    region: 'CA',
    postcode: '94107',
    country: 'US', // Added missing country field
    formatted_address: '123 Main St, San Francisco, CA 94107, US', // Added missing formatted_address field
  },
  photos: [
    {
      id: 'photo-123',
      created_at: '2023-01-01T12:00:00Z',
      prefix: 'https://fastly.4sqi.net/img/general/200x200/',
      suffix: '/example.jpg',
      width: 400,
      height: 400,
    },
  ],
  // Added missing required properties
  chains: [],
  distance: 0,
  link: '',
  related_places: [],
  timezone: 'America/Los_Angeles',
};

// Mock a FoursquarePlace object for a park
const mockFoursquarePark: FoursquarePlace = {
  fsq_id: 'foursquare-park-456',
  name: 'City Green Park',
  description: 'Beautiful urban park with playgrounds and gardens',
  categories: [
    { 
      id: 16032, 
      name: 'Park',
      icon: {
        prefix: 'https://ss3.4sqi.net/img/categories_v2/parks_outdoors/park_',
        suffix: '.png'
      }
    },
    { 
      id: 16033, 
      name: 'Playground',
      icon: {
        prefix: 'https://ss3.4sqi.net/img/categories_v2/parks_outdoors/playground_',
        suffix: '.png'
      }
    },
  ],
  rating: 8.0,
  price: undefined, // Parks typically don't have prices
  website: undefined, // Changed from null to undefined
  geocodes: {
    main: {
      latitude: 37.7750,
      longitude: -122.4190,
    },
  },
  location: {
    address: '456 Park Ave',
    locality: 'San Francisco',
    region: 'CA',
    postcode: '94108',
    country: 'US', // Added missing country field
    formatted_address: '456 Park Ave, San Francisco, CA 94108, US', // Added missing formatted_address field
  },
  photos: [
    {
      id: 'photo-456',
      created_at: '2023-01-02T12:00:00Z',
      prefix: 'https://fastly.4sqi.net/img/general/200x200/',
      suffix: '/park_example.jpg',
      width: 400,
      height: 400,
    },
  ],
  // Added missing required properties
  chains: [],
  distance: 0,
  link: '',
  related_places: [],
  timezone: 'America/Los_Angeles',
};

// Mock FoursquarePlace for an event venue
const mockFoursquareEventVenue: FoursquarePlace = {
  fsq_id: 'foursquare-event-venue-789',
  name: 'The Music Hall',
  description: 'Premier music venue hosting concerts and events',
  categories: [
    { 
      id: 10027, 
      name: 'Music Venue',
      icon: {
        prefix: 'https://ss3.4sqi.net/img/categories_v2/arts_entertainment/musicvenue_',
        suffix: '.png'
      }
    },
    { 
      id: 10005, 
      name: 'Concert Hall',
      icon: {
        prefix: 'https://ss3.4sqi.net/img/categories_v2/arts_entertainment/concerthall_',
        suffix: '.png'
      }
    },
  ],
  rating: 8.4,
  price: 3,
  website: 'https://www.themusichall.com',
  geocodes: {
    main: {
      latitude: 37.7800,
      longitude: -122.4200,
    },
  },
  location: {
    address: '789 Stage Rd',
    locality: 'San Francisco',
    region: 'CA',
    postcode: '94102',
    country: 'US', // Added missing country field
    formatted_address: '789 Stage Rd, San Francisco, CA 94102, US', // Added missing formatted_address field
  },
  photos: [
    {
      id: 'photo-789',
      created_at: '2023-01-03T12:00:00Z',
      prefix: 'https://fastly.4sqi.net/img/general/200x200/',
      suffix: '/venue_example.jpg',
      width: 400,
      height: 400,
    },
  ],
  // Added missing required properties
  chains: [],
  distance: 0,
  link: '',
  related_places: [],
  timezone: 'America/Los_Angeles',
};

describe('transformFoursquarePlaceToLocalItem', () => {
  it('should transform a Foursquare restaurant to a LocalItem Restaurant', () => {
    const result = transformFoursquarePlaceToLocalItem(mockFoursquareRestaurant);
    expect(result).not.toBeNull();
    if (!result || result.type !== 'Restaurant') throw new Error("Test failed: Expected a Restaurant item.");

    // result is now known to be Restaurant
    expect(result.type).toBe('Restaurant');
    expect(result.id).toBe(mockFoursquareRestaurant.fsq_id);
    expect(result.apiSpecificId).toBe(mockFoursquareRestaurant.fsq_id);
    expect(result.sourceApi).toBe('foursquare');
    expect(result.name).toBe('Super Pizza Place');
    expect(result.location.latitude).toBe(37.7749);
    expect(result.location.longitude).toBe(-122.4194);
    expect(result.location.street).toBe('123 Main St');
    expect(result.location.city).toBe('San Francisco');
    expect(result.location.state).toBe('CA');
    expect(result.location.zipcode).toBe('94107');
    expect(result.cuisineType).toBe('Italian Restaurant'); // First category is used
    expect(result.priceRange).toBe('$$'); // Price 2 maps to $$
    expect(result.rating).toBe(4.5); // 9.0 / 2 = 4.5
    expect(result.imageUrl).toBe('https://fastly.4sqi.net/img/general/200x200/400x400/example.jpg');
    expect(result.website).toBe(mockFoursquareRestaurant.website);
  });

  it('should transform a Foursquare park to a LocalItem Park', () => {
    const result = transformFoursquarePlaceToLocalItem(mockFoursquarePark);
    expect(result).not.toBeNull();
    if (!result || result.type !== 'Park') throw new Error("Test failed: Expected a Park item.");

    // result is Park
    expect(result.type).toBe('Park');
    expect(result.id).toBe(mockFoursquarePark.fsq_id);
    expect(result.name).toBe('City Green Park');
    expect(result.parkType).toBe('Park');
    expect(result.amenities).toEqual(expect.arrayContaining(['Park', 'Playground']));
    expect(result.location.city).toBe('San Francisco');
    expect(result.rating).toBe(4.0); // 8.0 / 2 = 4.0
    expect(result.location.street).toBe('456 Park Ave');
  });

  it('should transform a Foursquare music venue to a LocalItem Event', () => {
    const result = transformFoursquarePlaceToLocalItem(mockFoursquareEventVenue);
    expect(result).not.toBeNull();
    if (!result || result.type !== 'Event') throw new Error("Test failed: Expected an Event item.");
    
    // result is Event
    expect(result.type).toBe('Event');
    expect(result.id).toBe(mockFoursquareEventVenue.fsq_id);
    expect(result.name).toBe('The Music Hall');
    expect(result.eventType).toBe('Music Venue');
    expect(result.startDate).toBeDefined();
    expect(new Date(result.startDate).toISOString()).toEqual(result.startDate);
    expect(result.location.street).toBe('789 Stage Rd');
    expect(result.rating).toBe(4.2); // 8.4 / 2 = 4.2
  });

  it('should return null for unknown category types', () => {
    const unknownCategoryPlace: FoursquarePlace = {
      ...mockFoursquareRestaurant,
      fsq_id: 'unknown-place-123',
      categories: [
        { 
          id: 19001, 
          name: 'Gas Station',
          icon: {
            prefix: 'https://ss3.4sqi.net/img/categories_v2/shops/gas_',
            suffix: '.png'
          }
        },
        { 
          id: 19002, 
          name: 'Automotive',
          icon: {
            prefix: 'https://ss3.4sqi.net/img/categories_v2/shops/automotive_',
            suffix: '.png'
          }
        },
      ],
    };
    const result = transformFoursquarePlaceToLocalItem(unknownCategoryPlace);
    expect(result).toBeNull();
  });

  it('should handle places with missing optional fields correctly', () => {
    const minimalPlace: FoursquarePlace = {
      fsq_id: 'minimal-place-456',
      name: 'Basic Restaurant',
      description: undefined, // Changed from null to undefined
      categories: [
        { 
          id: 13000, 
          name: 'Restaurant',
          icon: {
            prefix: 'https://ss3.4sqi.net/img/categories_v2/food/default_',
            suffix: '.png'
          }
        },
      ],
      rating: undefined, // Changed from null to undefined
      price: undefined,
      website: undefined, // Changed from null to undefined
      geocodes: {
        main: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      },
      location: {
        address: undefined, // Changed from null to undefined
        locality: undefined, // Changed from null to undefined
        region: undefined, // Changed from null to undefined
        postcode: undefined, // Changed from null to undefined
        country: 'US', // Added missing country field
        formatted_address: 'San Francisco, US', // Added missing formatted_address field
      },
      photos: [],
      // Added missing required properties
      chains: [],
      distance: 0,
      link: '',
      related_places: [],
      timezone: 'America/Los_Angeles',
    };

    const result = transformFoursquarePlaceToLocalItem(minimalPlace);
    expect(result).not.toBeNull();
    
    if (result) {
      expect(result.imageUrl).toBeUndefined();
      expect(result.location.street).toBeUndefined(); // Changed expectation from toBeNull to toBeUndefined
      expect(result.location.city).toBeUndefined(); // Changed expectation from toBeNull to toBeUndefined
      expect(result.location.state).toBeUndefined(); // Changed expectation from toBeNull to toBeUndefined
      expect(result.location.zipcode).toBeUndefined(); // Changed expectation from toBeNull to toBeUndefined
      expect(result.rating).toBeUndefined();
      expect(result.website).toBeUndefined(); // Changed expectation from toBeNull to toBeUndefined
      expect(result.description).toBe('Restaurant'); // Falls back to category names

      if (result.type === 'Restaurant') {
        expect(result.priceRange).toBeUndefined();
      }
    }
  });

  it('should handle hierarchical category matching correctly', () => {
    // Test that a specific food subcategory (13065) gets matched to food (13000)
    const subcategoryPlace: FoursquarePlace = {
      ...mockFoursquareRestaurant,
      fsq_id: 'subcategory-test',
      categories: [
        { 
          id: 13065, 
          name: 'Italian Restaurant',
          icon: {
            prefix: 'https://ss3.4sqi.net/img/categories_v2/food/italian_',
            suffix: '.png'
          }
        },
      ],
    };

    const result = transformFoursquarePlaceToLocalItem(subcategoryPlace);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('Restaurant');
  });
});

describe('transformFoursquareResponseToLocalItems', () => {
  it('should transform a list of Foursquare places', () => {
    const foursquareResponseMock: FoursquareSearchResponse = {
      results: [mockFoursquareRestaurant, mockFoursquarePark, mockFoursquareEventVenue],
    };

    const results = transformFoursquareResponseToLocalItems(foursquareResponseMock);
    expect(results).toHaveLength(3);
    expect(results.map(r => r.id)).toEqual([
      'foursquare-resto-123',
      'foursquare-park-456',
      'foursquare-event-venue-789'
    ]);
    expect(results[0].type).toBe('Restaurant');
    expect(results[1].type).toBe('Park');
    expect(results[2].type).toBe('Event');
  });

  it('should filter out places where type cannot be determined', () => {
    const unknownCategoryPlace: FoursquarePlace = {
      ...mockFoursquareRestaurant,
      fsq_id: 'unknown-place-id',
      name: 'Unknown Business Type',
      categories: [
        { 
          id: 19001, 
          name: 'Gas Station',
          icon: {
            prefix: 'https://ss3.4sqi.net/img/categories_v2/shops/gas_',
            suffix: '.png'
          }
        },
      ],
    };
    
    const foursquareResponseMock: FoursquareSearchResponse = {
      results: [mockFoursquareRestaurant, unknownCategoryPlace, mockFoursquarePark],
    };

    const results = transformFoursquareResponseToLocalItems(foursquareResponseMock);
    expect(results).toHaveLength(2);
    expect(results.map(r => r.id)).toEqual(['foursquare-resto-123', 'foursquare-park-456']);
  });

  it('should return an empty array if results array is empty or response is invalid', () => {
    expect(transformFoursquareResponseToLocalItems({ results: [] })).toEqual([]);
    
    expect(transformFoursquareResponseToLocalItems(null as any)).toEqual([]);
    
    expect(transformFoursquareResponseToLocalItems({} as any)).toEqual([]);
    
    expect(transformFoursquareResponseToLocalItems(undefined as any)).toEqual([]);
  });

  it('should handle mixed identifiable place types correctly', () => {
    const foursquareResponseMock: FoursquareSearchResponse = {
      results: [mockFoursquareRestaurant, mockFoursquarePark, mockFoursquareEventVenue],
    };

    const results = transformFoursquareResponseToLocalItems(foursquareResponseMock);
    expect(results).toHaveLength(3);
    
    const types = results.map(r => r.type);
    expect(types).toContain('Restaurant');
    expect(types).toContain('Park');
    expect(types).toContain('Event');
  });

  it('should handle places without photos correctly', () => {
    const placeWithoutPhotos: FoursquarePlace = {
      ...mockFoursquareRestaurant,
      fsq_id: 'no-photos-place',
      photos: [],
    };

    const foursquareResponseMock: FoursquareSearchResponse = {
      results: [placeWithoutPhotos],
    };

    const results = transformFoursquareResponseToLocalItems(foursquareResponseMock);
    expect(results).toHaveLength(1);
    expect(results[0].imageUrl).toBeUndefined();
  });
});