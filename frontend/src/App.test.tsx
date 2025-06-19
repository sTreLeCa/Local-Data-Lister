/// <reference types="vitest" />
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { fetchLocalItems, fetchExternalItems } from './services/localItemService';
import type { LocalItem, Restaurant, Park } from '@local-data/types';

vi.mock('./services/localItemService', () => ({
  fetchLocalItems: vi.fn(),
  fetchExternalItems: vi.fn(),
}));

const mockRestaurant: Restaurant = { id: "r1", name: "Luigi's Pizza Palace", type: "Restaurant", location: { latitude: 40.7550, longitude: -73.9990 }, description: "Italian pizza.", cuisineType: "Italian", rating: 4.5 };
const mockPark: Park = { id: "p1", name: "City Center Park", type: "Park", location: { latitude: 40.7306, longitude: -73.9352 }, description: "A green space.", parkType: "City Park", amenities: ["playground"] };
const allMockLocalItems: LocalItem[] = [mockRestaurant, mockPark];
const mockExternalTacos: LocalItem[] = [{ id: "yelp-1", name: "Yelp's Fiery Tacos", type: "Restaurant", location: { latitude: 0, longitude: 0 }, description: "Mock tacos", cuisineType: "Mexican" }];

describe('<App />', () => {
  const mockedFetchLocalItems = vi.mocked(fetchLocalItems);
  const mockedFetchExternalItems = vi.mocked(fetchExternalItems);

  beforeEach(() => {
    mockedFetchLocalItems.mockClear();
    mockedFetchExternalItems.mockClear();
    mockedFetchLocalItems.mockResolvedValue(allMockLocalItems);
  });
  
  describe('Initial Data (Local Items)', () => {
    it('displays the initial list of local items on load', async () => {
      render(<App />);
      // Wait for initial load to complete by finding an item from it
      expect(await screen.findByText("Luigi's Pizza Palace")).toBeInTheDocument();
      expect(screen.getByText("City Center Park")).toBeInTheDocument(); // Can use getByText if previous findByText ensures loading is done
    });
  });

  describe('External Data Flow', () => {
    // Helper function to ensure initial load is complete before each external test
    async function setupAppForExternalSearch() {
      render(<App />);
      // Wait for the local items to load, ensuring the app is fully initialized
      await screen.findByText("Luigi's Pizza Palace");
    }

    it('should show a loading state and then display external items when search is clicked', async () => {
      await setupAppForExternalSearch(); // Ensure app is ready
      
      let resolvePromise: (value: LocalItem[]) => void;
      const promise = new Promise<LocalItem[]>((resolve) => { resolvePromise = resolve; });
      mockedFetchExternalItems.mockReturnValue(promise);

      const searchButton = screen.getByRole('button', { name: /search external data/i });
      await userEvent.click(searchButton);

      expect(await screen.findByText(/loading external data.../i)).toBeInTheDocument();

      await act(async () => { resolvePromise(mockExternalTacos); });
      
      expect(await screen.findByText("Yelp's Fiery Tacos")).toBeInTheDocument();
      expect(screen.queryByText(/loading external data.../i)).not.toBeInTheDocument();
    });

    it('should show an error message if the external fetch fails', async () => {
      await setupAppForExternalSearch(); // Ensure app is ready
      
      mockedFetchExternalItems.mockRejectedValue(new Error('Yelp API is down'));
      
      const searchButton = screen.getByRole('button', { name: /search external data/i });
      await userEvent.click(searchButton);
      
      expect(await screen.findByText(/error: yelp api is down/i)).toBeInTheDocument();
    });

    it('should pass the correct location and query parameters to the service', async () => {
      await setupAppForExternalSearch(); // Ensure app is ready
      
      mockedFetchExternalItems.mockResolvedValue([]);
      
      // Now that the initial load is complete, these elements should be reliably found
      const locationInput = screen.getByPlaceholderText(/enter a location/i);
      // Inside the test: "should pass the correct location and query parameters to the service"
      const queryInput = screen.getByPlaceholderText(/Enter a search term \(e.g., park, pizza\)/i);
      const searchButton = screen.getByRole('button', { name: /search external data/i });

      await userEvent.clear(locationInput);
      await userEvent.type(locationInput, 'Boston');
      await userEvent.clear(queryInput);
      await userEvent.type(queryInput, 'sushi');
      
      await userEvent.click(searchButton);
      
      expect(mockedFetchExternalItems).toHaveBeenCalledWith({
        location: 'Boston',
        query: 'sushi'
      });
    });
  });
});