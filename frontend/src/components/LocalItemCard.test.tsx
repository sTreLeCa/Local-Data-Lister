// frontend/src/components/LocalItemCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocalItemCard } from './LocalItemCard';
import type { Restaurant, Park, Event } from '@local-data/types';

// --- Mock Data Setup ---
// We create mock objects for each type of LocalItem (Restaurant, Park, Event)
// to test the component's rendering logic in isolation for each case.

/**
 * A mock Restaurant object to test how the card displays restaurant-specific details.
 */
const mockRestaurant: Restaurant = {
  id: 'rest-1',
  name: 'Bella Italia',
  type: 'Restaurant',
  description: 'Authentic Italian pizza.',
  location: { street: '123 Pizza Ln', city: 'Naples', state: 'IT', latitude: 40.8518, longitude: 14.2681 },
  cuisineType: 'Italian',
  rating: 4.7,
  priceRange: '$$'
};

/**
 * A mock Park object to test park-specific details like amenities.
 */
const mockPark: Park = {
  id: 'park-1',
  name: 'Central Greenspace',
  type: 'Park',
  description: 'A beautiful park.',
  location: { city: 'Testville', state: 'TS', latitude: 40.7850, longitude: -73.9682 },
  parkType: 'Urban Park',
  amenities: ['Playground', 'Dog Run'],
  rating: 4.9
};

/**
 * A mock Event object to test event-specific details like date and type.
 */
const mockEvent: Event = {
  id: 'event-1',
  name: 'Summer Music Fest',
  type: 'Event',
  description: 'Annual music festival.',
  location: { latitude: 41.8781, longitude: -87.6298 },
  eventType: 'Music Festival',
  startDate: '2024-08-15T18:00:00Z',
};


describe('<LocalItemCard />', () => {
  it('renders a Restaurant item correctly', () => {
    render(<LocalItemCard item={mockRestaurant} />);
    
    // Find the label first, which is guaranteed to be in its own element (<strong>).
    const cuisineLabel = screen.getByText('Cuisine:');
    
    // Then, check the parent element's full text content. This is a robust way
    // to test text that might be broken up by other HTML elements (like <strong> or <span>).
    expect(cuisineLabel.parentElement).toHaveTextContent('Cuisine: Italian | $$');
  });

  it('renders a Park item correctly', () => {
    render(<LocalItemCard item={mockPark} />);
    
    // Using the same parent-element strategy to test amenities.
    const amenitiesLabel = screen.getByText('Amenities:');
    expect(amenitiesLabel.parentElement).toHaveTextContent('Amenities: Playground, Dog Run');
  });

  it('renders an Event item correctly', () => {
    render(<LocalItemCard item={mockEvent} />);

    // This approach is more resilient to changes in the surrounding text (e.g., changing 'on' to 'at').
    const eventLabel = screen.getByText('Event:');
    expect(eventLabel.parentElement).toHaveTextContent('Event: Music Festival on 8/15/2024');
  });
  
  // The following tests for auth-related features remain as they were, as they test button presence and interactions.
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