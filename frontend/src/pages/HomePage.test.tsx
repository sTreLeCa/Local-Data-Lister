// frontend/src/pages/HomePage.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import * as localItemService from '../api/localItemService';
import * as favoritesService from '../api/favoritesService';
import { useAuthStore } from '../store/authStore';
import type { LocalItem, Restaurant, Park } from '@local-data/types';

vi.mock('../api/localItemService');
vi.mock('../api/favoritesService');
vi.mock('../store/authStore');

const mockRestaurant: Restaurant = { id: "r1", name: "Luigi's Pizza Palace", type: "Restaurant", location: { latitude: 40.7550, longitude: -73.9990 }, description: "Italian pizza.", cuisineType: "Italian", rating: 4.5 };
const mockPark: Park = { id: "p1", name: "City Center Park", type: "Park", location: { latitude: 40.7306, longitude: -73.9352 }, description: "A green space.", parkType: "City Park", amenities: ['Playground'] };
const allMockLocalItems: LocalItem[] = [mockRestaurant, mockPark];
const renderHomePage = () => {
    render(
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>
    );
};

describe('<HomePage />', () => {
    const mockedLocalItemService = vi.mocked(localItemService);
    const mockedFavoritesService = vi.mocked(favoritesService);
    const mockedUseAuthStore = vi.mocked(useAuthStore);

    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseAuthStore.mockReturnValue({
            isAuthenticated: () => false,
            token: null,
            user: null,
            login: vi.fn(),
            logout: vi.fn(),
        });
        mockedLocalItemService.fetchLocalItems.mockResolvedValue(allMockLocalItems);
        mockedFavoritesService.fetchFavorites.mockResolvedValue([]);
    });
  
    it('displays the initial list of local items on load', async () => {
        renderHomePage();
        expect(await screen.findByText("Luigi's Pizza Palace")).toBeInTheDocument();
        expect(screen.getByText("City Center Park")).toBeInTheDocument();
        expect(mockedLocalItemService.fetchLocalItems).toHaveBeenCalledTimes(1);
    });

    it('fetches favorites when the user is authenticated', async () => {
        mockedUseAuthStore.mockReturnValue({
            isAuthenticated: () => true,
            token: 'fake-token',
            user: { userId: '123', email: 'test@test.com' },
            login: vi.fn(),
            logout: vi.fn(),
        });
        renderHomePage();
        await waitFor(() => {
            expect(mockedLocalItemService.fetchLocalItems).toHaveBeenCalledTimes(1);
            expect(mockedFavoritesService.fetchFavorites).toHaveBeenCalledTimes(1);
            expect(mockedFavoritesService.fetchFavorites).toHaveBeenCalledWith('fake-token');
        });
    });
});