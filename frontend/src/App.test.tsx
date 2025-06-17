/// <reference types="vitest" />
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { fetchLocalItems, fetchExternalItems } from './services/localItemService';
import type { LocalItem, Restaurant, Park } from '@local-data/types';

// Mock the entire service module. This is correct.
vi.mock('./services/localItemService', () => ({
  fetchLocalItems: vi.fn(),
  fetchExternalItems: vi.fn(),
}));

// Mock data remains the same.
const mockRestaurant: Restaurant = { id: "r1", name: "Luigi's Pizza Palace", type: "restaurant", location: { latitude: 40.7550, longitude: -73.9990 }, description: "Italian pizza.", cuisineType: "Italian", rating: 4.5 };
const mockPark: Park = { id: "p1", name: "City Center Park", type: "park", location: { latitude: 40.7306, longitude: -73.9352 }, description: "A green space.", parkType: "City Park", amenities: ["playground"] };
const allMockLocalItems: LocalItem[] = [mockRestaurant, mockPark];
const mockExternalTacos: LocalItem[] = [{ id: "yelp-1", name: "Yelp's Fiery Tacos", type: "restaurant", location: { latitude: 0, longitude: 0 }, description: "Mock tacos", cuisineType: "Mexican" }];

describe('<App />', () => {
  const mockedFetchLocalItems = vi.mocked(fetchLocalItems);
  const mockedFetchExternalItems = vi.mocked(fetchExternalItems);

  beforeEach(() => {
    // We only need to clear the mocks. No fake timers.
    mockedFetchLocalItems.mockClear();
    mockedFetchExternalItems.mockClear();
    
    // For every test, we assume the initial data loads successfully.
    mockedFetchLocalItems.mockResolvedValue(allMockLocalItems);
  });
  
  describe('Initial Data (Local Items)', () => {
    it('displays the initial list of local items on load', async () => {
      render(<App />);
      // Just wait for the final content to appear. This is enough to prove it loaded.
      expect(await screen.findByText("Luigi's Pizza Palace")).toBeInTheDocument();
      expect(await screen.findByText("City Center Park")).toBeInTheDocument();
    });
  });

  describe('External Data Flow', () => {

    it('should show a loading state and then display external items when search is clicked', async () => {
      // Arrange
      // We will create a mock that resolves manually to control the flow precisely.
      let resolvePromise: (value: LocalItem[]) => void;
      const promise = new Promise<LocalItem[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockedFetchExternalItems.mockReturnValue(promise);

      render(<App />);

      // Act 1: Click the search button. The promise is now pending.
      const searchButton = screen.getByRole('button', { name: /search external data/i });
      await userEvent.click(searchButton);

      // Assert 1: The loading message MUST be on the screen now.
      expect(await screen.findByText(/loading external data.../i)).toBeInTheDocument();

      // Act 2: Manually resolve the promise, as if the network request just finished.
      await act(async () => {
        resolvePromise(mockExternalTacos);
      });
      
      // Assert 2: The final result should now be on the screen.
      expect(await screen.findByText("Yelp's Fiery Tacos")).toBeInTheDocument();
      expect(screen.queryByText(/loading external data.../i)).not.toBeInTheDocument();
    });

    it('should show an error message if the external fetch fails', async () => {
      mockedFetchExternalItems.mockRejectedValue(new Error('Yelp API is down'));
      render(<App />);
      
      const searchButton = screen.getByRole('button', { name: /search external data/i });
      await userEvent.click(searchButton);
      
      expect(await screen.findByText(/error: yelp api is down/i)).toBeInTheDocument();
    });

    it('should pass the correct location and query parameters to the service', async () => {
      mockedFetchExternalItems.mockResolvedValue([]);
      render(<App />);
      
      const locationInput = screen.getByPlaceholderText(/enter a location/i);
      const queryInput = screen.getByPlaceholderText(/enter a query/i);
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