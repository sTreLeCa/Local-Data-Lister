// backend/src/__tests__/api.test.ts
import request from 'supertest'; 
import app from '../server';     
import fs from 'fs/promises';    
import path from 'path';         
import type { LocalItem } from '@local-data/types'; 


jest.mock('fs/promises');


const mockedFsReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

const mockLocalItemsDataForTest: LocalItem[] = [
  {
    id: 'r1-test',
    name: 'Test Cafe',
    description: 'A mock cafe for testing.',
    location: { latitude: 10.0, longitude: 20.0, street: '1 Test St' },
    rating: 4.0,
    type: 'restaurant',
    cuisineType: 'Test Cuisine',
  },
  {
    id: 'p1-test',
    name: 'Test Park',
    description: 'A mock park for testing.',
    location: { latitude: 30.0, longitude: 40.0, city: 'Test City' },
    rating: 4.5,
    type: 'park',
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
   
    mockedFsReadFile.mockResolvedValue(JSON.stringify(mockLocalItemsDataForTest));

    const response = await request(app).get('/api/local-items');


    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockLocalItemsDataForTest);
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });

  
  it('should return 500 Internal Server Error if fs.readFile throws an error', async () => {
    
    mockedFsReadFile.mockRejectedValue(new Error('Simulated file system error'));

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(500);
 
    expect(response.body).toEqual({ message: 'Error fetching local items data.' });
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });


  it('should return 500 Internal Server Error if JSON.parse throws an error (invalid JSON content)', async () => {
 
    mockedFsReadFile.mockResolvedValue('this is not valid json');

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Error fetching local items data.' });
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });

  
  it('should return 500 Internal Server Error if the data file is empty', async () => {
    mockedFsReadFile.mockResolvedValue(''); 

    const response = await request(app).get('/api/local-items');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Error fetching local items data.' });
    expect(mockedFsReadFile).toHaveBeenCalledWith(dataFilePath, 'utf-8');
  });
});