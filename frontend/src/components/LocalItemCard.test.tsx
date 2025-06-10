// frontend/src/components/LocalItemCard.test.tsx
import { render, screen } from '@testing-library/react';
import LocalItemCard from './LocalItemCard';
import type { Restaurant, Park, EventItem } from '@local-data/types'; // Or from '../types'
import { describe, it, expect } from 'vitest'; // Explicitly import for clarity

describe('<LocalItemCard />', () => {
  it('renders Restaurant information correctly', () => {
    const mockRestaurant: Restaurant = {
      id: 'rest1', type: 'restaurant', name: 'Test Pizzeria',
      description: 'Serves pizza',
      location: { street: '1 Pizza Ln', city: 'Testville', state: 'TS', latitude: 10, longitude: 10 },
      cuisineType: 'Italian', priceRange: '$$', rating: 4.5
    };
    render(<LocalItemCard item={mockRestaurant} />);
    expect(screen.getByText('Test Pizzeria')).toBeInTheDocument();
    expect(screen.getByText(/Type: Restaurant/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuisine: Italian/i)).toBeInTheDocument();
    // ... add more assertions for other fields
  });

  // Add similar tests for Park and EventItem here
  // Add test for gracefully handling missing optional fields
});