// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { LocalItem } from '@local-data/types';
import path from 'path'; // <-- Add this import
import fs from 'fs/promises'; // <-- Add this import for async file operations

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// A simple root route to check if the server is alive
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// --- THIS IS YOUR NEW API ENDPOINT ---
app.get('/api/local-items', async (req, res) => {
  try {
    // Construct an absolute path to the JSON file.
    // This is more robust than a relative path.
    const filePath = path.join(__dirname, 'data', 'local-items.json');
    
    // Read the file content asynchronously.
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Parse the JSON string into a JavaScript array and type it.
    const items: LocalItem[] = JSON.parse(fileContent);
    
    // Send the data with a 200 OK status.
    res.status(200).json(items);
  } catch (error) {
    // Log the error on the server for debugging.
    console.error('Failed to read or parse local items data:', error);
    
    // Send a 500 Internal Server Error response to the client.
    res.status(500).json({ message: 'Error fetching local items data.' });
  }
});

export default app;