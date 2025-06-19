// backend/src/__tests__/api.test.ts
import request from 'supertest'; 
import app from '../server';     
import fs from 'fs/promises';    
import path from 'path';         
import type { LocalItem } from '@local-data/types';
import { jest, describe, it, expect, afterEach } from '@jest/globals';

jest.mock('fs/promises');

const mockedFsReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
const mockedFsAccess = fs.access as jest.MockedFunction<typeof fs.access>;

// FIX: Changed 'restaurant' and 'park' to 'Restaurant' and 'Park' to match the shared types.
const mockLocalItemsDataForTest: LocalItem[] = [
  {
    id: 'r1-test',
    name: 'Test Cafe',
    description: 'A mock cafe for testing.',
    location: { latitude: 10.0, longitude: 20.0, street: '1 Test St' },
    rating: 4.0,
    type: 'Restaurant', // <-- FIX HERE: Changed from 'restaurant' to 'Restaurant'
    cuisineType: 'Test Cuisine',
  },
  {
    id: 'p1-test',
    name: 'Test Park',
    description: 'A mock park for testing.',
    location: { latitude: 30.0, longitude: 40.0, city: 'Test City' },
    rating: 4.5,
    type: 'Park', // <-- FIX HERE: Changed from 'park' to 'Park'
    parkType: 'Test Park Type',
    amenities: ['test_amenity_1', 'test_amenity_2'],
  },
];

describe('GET /api/local-items', () => {
  const dataFilePath = path.join(__dirname, '..', 'data', 'local-items.json');

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 OK and local items when data is read and parsed successfully', async () => {
    // Mock both fs.access and fs.readFile for successful case
    mockedFsAccess.mockResolvedValue(undefined);
    mockedFsReadFile.mockResolvedValue(JSON.stringify(mockLocalItemsDataForTest));

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockLocalItemsDataForTest);
    expect(mockedFsAccess).toHaveBeenCalledWith(dataFilePath);
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });

  it('should return 404 if the data file does not exist', async () => {
    // Mock fs.access to throw an error (file not found)
    mockedFsAccess.mockRejectedValue(new Error('File not found'));

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Local items data file not found.',
      code: 'DATA_FILE_NOT_FOUND'
    });
    expect(mockedFsAccess).toHaveBeenCalledWith(dataFilePath);
  });

  it('should return 500 Internal Server Error if fs.readFile throws an error', async () => {
    // Mock fs.access to succeed but fs.readFile to fail
    mockedFsAccess.mockResolvedValue(undefined);
    mockedFsReadFile.mockRejectedValue(new Error('Simulated file system error'));

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Error fetching local items data.',
      code: 'DATA_READ_ERROR'
    });
    expect(mockedFsAccess).toHaveBeenCalledWith(dataFilePath);
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });

  it('should return 500 Internal Server Error if JSON.parse throws an error (invalid JSON content)', async () => {
    // Mock fs.access to succeed and fs.readFile to return invalid JSON
    mockedFsAccess.mockResolvedValue(undefined);
    mockedFsReadFile.mockResolvedValue('this is not valid json');

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Error parsing local items data.',
      code: 'JSON_PARSE_ERROR'
    });
    expect(mockedFsAccess).toHaveBeenCalledWith(dataFilePath);
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });

  it('should return 500 Internal Server Error if the data file is empty', async () => {
    // Mock fs.access to succeed and fs.readFile to return empty string
    mockedFsAccess.mockResolvedValue(undefined);
    mockedFsReadFile.mockResolvedValue(''); 

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Error fetching local items: data source is empty.',
      code: 'EMPTY_DATA_FILE'
    });
    expect(mockedFsAccess).toHaveBeenCalledWith(dataFilePath);
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });

  it('should return 500 Internal Server Error if the parsed data is not an array', async () => {
    // Mock fs.access to succeed and fs.readFile to return non-array JSON
    mockedFsAccess.mockResolvedValue(undefined);
    mockedFsReadFile.mockResolvedValue('{"not": "an array"}');

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Invalid data format: expected array.',
      code: 'INVALID_DATA_FORMAT'
    });
    expect(mockedFsAccess).toHaveBeenCalledWith(dataFilePath);
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });
});