import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LocalItemCard } from './LocalItemCard';
// FIX: Import the correct, unified 'Event' type. 'EventItem' does not exist.
import type { Restaurant, Park, Event } from '@local-data/types';

const mockRestaurant: Restaurant = {
  id: 'rest-1',
  name: 'Bella Italia',
  type: 'Restaurant',
  description: 'Authentic Italian pizza.',
  location: {
    street: '123 Pizza Ln',
    city: 'Naples',
    state: 'IT',
    latitude: 40.8518,
    longitude: 14.2681
  },
  cuisineType: 'Italian',
  rating: 4.7,
  priceRange: '$$'
};

const mockPark: Park = {
  id: 'park-1',
  name: 'Central Greenspace',
  type: 'Park',
  description: 'A beautiful park.',
  location: {
    city: 'Testville',
    state: 'TS',
    latitude: 40.7850,
    longitude: -73.9682
  },
  parkType: 'Urban Park',
  amenities: ['Playground', 'Dog Run'],
  rating: 4.9
};

// FIX: Mock data now uses the standardized 'Event' type with 'startDate' and 'ticketPrice'
const mockEvent: Event = {
  id: 'event-1',
  name: 'Summer Music Fest',
  type: 'Event',
  description: 'Annual music festival.',
  location: {
    latitude: 41.8781,
    longitude: -87.6298
  },
  eventType: 'Music Festival',
  startDate: '2024-08-15T18:00:00Z',
  ticketPrice: 75.00
};

describe('<LocalItemCard />', () => {
  it('renders a Restaurant item correctly', () => {
    render(<LocalItemCard item={mockRestaurant} />);
    expect(screen.getByText('Bella Italia')).toBeInTheDocument();
    expect(screen.getByText('Rating: 4.7/5')).toBeInTheDocument();
    expect(screen.getByText('Cuisine: Italian')).toBeInTheDocument();
  });

  it('renders a Park item correctly', () => {
    render(<LocalItemCard item={mockPark} />);
    expect(screen.getByText('Central Greenspace')).toBeInTheDocument();
    expect(screen.getByText('Park Type: Urban Park')).toBeInTheDocument();
    expect(screen.getByText('Amenities: Playground, Dog Run')).toBeInTheDocument();
  });

  it('renders an Event item correctly', () => {
    render(<LocalItemCard item={mockEvent} />);
    expect(screen.getByText('Summer Music Fest')).toBeInTheDocument();
    expect(screen.getByText(/Date: 8\/15\/2024/)).toBeInTheDocument();
    expect(screen.getByText('Price: $75.00')).toBeInTheDocument();
  });
});