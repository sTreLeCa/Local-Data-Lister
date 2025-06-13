// frontend/src/App.test.tsx
/// <reference types="vitest" /> 
// ^^^ Add this triple-slash directive at the TOP for 'vi' namespace

import { render, screen, waitFor } from '@testing-library/react';
import App from './App'; // Assuming App.tsx is in the same directory (src/)
import { describe, it, expect } from 'vitest'; // Explicitly import Vitest globals

// NO MOCKING of './services/localItemService' NEEDED HERE YET
// because App.tsx is using its own internal mockFetchLocalItems

describe('<App /> behavior with internal mock data', () => {

  it('displays loading state initially, then renders mocked restaurants', async () => {
    render(<App />);
    
    // Check for loading message
    expect(screen.getByText(/Loading local items.../i)).toBeInTheDocument();

    // Wait for loading to complete and items to appear.
    // This test relies on the default behavior of mockFetchLocalItems in App.tsx,
    // which should resolve with mockLocalItems.
    await waitFor(() => {
      // Check that loading text is gone
      expect(screen.queryByText(/Loading local items.../i)).not.toBeInTheDocument();
    }, { timeout: 2000 }); // Give it a bit more time if your mock has a delay

    // Now check if some item names from your App.tsx's mockLocalItems are present.
    // Update these names to match exactly what's in your App.tsx's mockLocalItems array.
    expect(screen.getByText("Luigi's Pizza Palace")).toBeInTheDocument();
    expect(screen.getByText("City Center Park")).toBeInTheDocument();
    // Add more assertions for other items from your mockLocalItems if you want to be thorough
  });

  // Placeholder for tests related to P9.3 (error/empty states) - to be fully automated later
  // For now, these are manually verified by editing App.tsx's internal mockFetchLocalItems
  it.todo('P9.3: manually verify error state display (when mockFetchLocalItems rejects)');
  it.todo('P9.3: manually verify empty state display (when mockFetchLocalItems resolves with [])');


  // Placeholder for P12.1 (Filtering tests) - you will add these next
  describe('Filtering Logic (P12.1)', () => {
    it.todo('filters restaurants by name');
    it.todo('filters restaurants by cuisine type');
    // ... more filtering tests ...
    it.todo('shows "no results" message for non-matching search term');
    it.todo('shows all restaurants when search term is cleared');
    it.todo('filtering is case-insensitive');
  });
});