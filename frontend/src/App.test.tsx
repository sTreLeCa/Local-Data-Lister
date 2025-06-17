/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { fetchLocalItems } from './services/localItemService';
import type { LocalItem, Restaurant, Park } from '@local-data/types';

vi.mock('./services/localItemService', () => ({
  fetchLocalItems: vi.fn(),
}));

const mockRestaurant: Restaurant = { id: "r1", name: "Luigi's Pizza Palace", type: "restaurant", location: { latitude: 40.7550, longitude: -73.9990 }, description: "Italian pizza.", cuisineType: "Italian", rating: 4.5 };
const mockPark: Park = { id: "p1", name: "City Center Park", type: "park", location: { latitude: 40.7306, longitude: -73.9352 }, description: "A green space.", parkType: "City Park", amenities: ["playground"] };
const allMockItems: LocalItem[] = [mockRestaurant, mockPark];

describe('<App />', () => {
  const mockedFetchLocalItems = vi.mocked(fetchLocalItems);

  beforeEach(() => {
    mockedFetchLocalItems.mockClear();
  });

  describe('Data Fetching States', () => {
    it('should display a loading message initially', () => {
      mockedFetchLocalItems.mockReturnValue(new Promise(() => {}));
      render(<App />);
      expect(screen.getByText(/Loading local items.../i)).toBeInTheDocument();
    });
    it('should display an error message if the fetch fails', async () => {
      mockedFetchLocalItems.mockRejectedValue(new Error('Network failure'));
      render(<App />);
      expect(await screen.findByText(/Error: Network failure/i)).toBeInTheDocument();
    });
    it('should display the list of items on successful fetch', async () => {
      mockedFetchLocalItems.mockResolvedValue(allMockItems);
      render(<App />);
      expect(await screen.findByText("Luigi's Pizza Palace")).toBeInTheDocument();
      expect(screen.getByText("City Center Park")).toBeInTheDocument();
    });
  });

  describe('Client-side Filtering Logic', () => {
    beforeEach(async () => {
      mockedFetchLocalItems.mockResolvedValue(allMockItems);
      render(<App />);
      await screen.findByText("Luigi's Pizza Palace");
    });
    const getSearchInput = () => screen.getByPlaceholderText(/Search by name, description, location, type.../i);
    it('filters items by name', async () => {
      await userEvent.type(getSearchInput(), 'pizza');
      expect(screen.getByText("Luigi's Pizza Palace")).toBeInTheDocument();
      expect(screen.queryByText("City Center Park")).not.toBeInTheDocument();
    });
    it('shows all items again when search is cleared', async () => {
      const searchInput = getSearchInput();
      await userEvent.type(searchInput, 'pizza');
      expect(screen.queryByText("City Center Park")).not.toBeInTheDocument();
      await userEvent.clear(searchInput);
      expect(screen.getByText("Luigi's Pizza Palace")).toBeInTheDocument();
      expect(screen.getByText("City Center Park")).toBeInTheDocument();
    });
  });
});