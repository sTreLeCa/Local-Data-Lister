// frontend/src/components/LocalItemCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocalItemCard } from './LocalItemCard';
// --- 1. Import the specific types ---
import type { Restaurant, Park, Event } from '@local-data/types';

// --- 2. Explicitly type the mock objects ---
const mockRestaurant: Restaurant = {
  id: 'rest-1',
  name: 'Bella Italia',
  type: 'Restaurant', // Now TypeScript knows this is the literal "Restaurant"
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
  type: 'Park', // TypeScript knows this is the literal "Park"
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

const mockEvent: Event = {
  id: 'event-1',
  name: 'Summer Music Fest',
  type: 'Event', // TypeScript knows this is the literal "Event"
  description: 'Annual music festival.',
  location: {
    latitude: 41.8781,
    longitude: -87.6298
  },
  eventType: 'Music Festival',
  startDate: '2024-08-15T18:00:00Z',
};


describe('<LocalItemCard />', () => {
  it('renders a Restaurant item correctly', () => {
    render(<LocalItemCard item={mockRestaurant} />);
    expect(screen.getByText('Bella Italia')).toBeInTheDocument();
    expect(screen.getByText('Cuisine: Italian')).toBeInTheDocument();
  });

  it('renders a Park item correctly', () => {
    render(<LocalItemCard item={mockPark} />);
    expect(screen.getByText('Central Greenspace')).toBeInTheDocument();
    expect(screen.getByText('Amenities: Playground, Dog Run')).toBeInTheDocument();
  });

  it('renders an Event item correctly', () => {
    render(<LocalItemCard item={mockEvent} />);
    expect(screen.getByText('Summer Music Fest')).toBeInTheDocument();
    expect(screen.getByText(/Date: 8\/15\/2024/)).toBeInTheDocument();
  });
  
  it('does not render a favorite button if user is not authenticated', () => {
    render(<LocalItemCard item={mockRestaurant} isAuth={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an empty heart if authenticated but not favorited', () => {
    render(
      <LocalItemCard 
        item={mockRestaurant} 
        isAuth={true} 
        isFavorited={false} 
        onToggleFavorite={vi.fn()}
      />
    );
    expect(screen.getByRole('button')).toHaveTextContent('🤍');
  });

  it('renders a full heart if authenticated and favorited', () => {
    render(
      <LocalItemCard 
        item={mockRestaurant} 
        isAuth={true} 
        isFavorited={true} 
        onToggleFavorite={vi.fn()}
      />
    );
    expect(screen.getByRole('button')).toHaveTextContent('❤️');
  });

  it('calls onToggleFavorite when the button is clicked', () => {
    const mockToggleFavorite = vi.fn();
    render(
      <LocalItemCard 
        item={mockRestaurant} 
        isAuth={true} 
        onToggleFavorite={mockToggleFavorite} 
      />
    );
    
    const favoriteButton = screen.getByRole('button');
    fireEvent.click(favoriteButton);
    
    expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
    expect(mockToggleFavorite).toHaveBeenCalledWith(mockRestaurant);
  });
});