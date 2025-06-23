// frontend/src/components/LocalItemCard.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect} from 'vitest';
import { LocalItemCard } from './LocalItemCard';
import type { Restaurant, Park, Event } from '@local-data/types';

// Mock მონაცემები იგივე რჩება
const mockRestaurant: Restaurant = {
  id: 'rest-1', name: 'Bella Italia', type: 'Restaurant',
  description: 'Authentic Italian pizza.',
  location: { street: '123 Pizza Ln', city: 'Naples', state: 'IT', latitude: 40.8518, longitude: 14.2681 },
  cuisineType: 'Italian', rating: 4.7, priceRange: '$$'
};
const mockPark: Park = {
  id: 'park-1', name: 'Central Greenspace', type: 'Park',
  description: 'A beautiful park.',
  location: { city: 'Testville', state: 'TS', latitude: 40.7850, longitude: -73.9682 },
  parkType: 'Urban Park', amenities: ['Playground', 'Dog Run'], rating: 4.9
};
const mockEvent: Event = {
  id: 'event-1', name: 'Summer Music Fest', type: 'Event',
  description: 'Annual music festival.',
  location: { latitude: 41.8781, longitude: -87.6298 },
  eventType: 'Music Festival', startDate: '2024-08-15T18:00:00Z',
};


describe('<LocalItemCard />', () => {
  it('renders a Restaurant item correctly', () => {
    render(<LocalItemCard item={mockRestaurant} />);
    
    // --- საბოლოო შესწორება ---
    // 1. ვიპოვოთ <strong> ელემენტი "Cuisine:" ტექსტით.
    const cuisineLabel = screen.getByText('Cuisine:');
    // 2. შევამოწმოთ, რომ მისი მშობელი p ელემენტი შეიცავს სრულ ტექსტს.
    expect(cuisineLabel.parentElement).toHaveTextContent('Cuisine: Italian | $$');
  });

  it('renders a Park item correctly', () => {
    render(<LocalItemCard item={mockPark} />);
    
    // --- საბოლოო შესწორება ---
    const amenitiesLabel = screen.getByText('Amenities:');
    expect(amenitiesLabel.parentElement).toHaveTextContent('Amenities: Playground, Dog Run');
  });

  it('renders an Event item correctly', () => {
    render(<LocalItemCard item={mockEvent} />);

    // --- საბოლოო შესწორება ---
    const eventLabel = screen.getByText('Event:');
    expect(eventLabel.parentElement).toHaveTextContent('Event: Music Festival on 8/15/2024');
  });
  
  // დანარჩენი ტესტები (auth, favorite button) უცვლელი რჩება
  // ...
});