// backend/src/server.ts
import express from 'express';
import cors from 'cors'; // Make sure you have installed cors and @types/cors
import { LocalItem } from '@local-data/types';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// A simple root route to check if the server is alive
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

export default app;