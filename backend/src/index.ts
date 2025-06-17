// backend/src/index.ts
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import app from './server';

const PORT = process.env.PORT || 4000;

// For verification, you can log the API key here (REMOVE AFTER VERIFICATION)
// console.log('Yelp API Key Loaded:', process.env.YELP_API_KEY ? 'Yes' : 'No - CHECK .ENV AND DOTENV CONFIG');
// if (!process.env.YELP_API_KEY) {
//   console.error("FATAL ERROR: Yelp API Key not found in environment variables.");
//   // process.exit(1); // Optionally exit if key is critical for startup
// }

app.listen(PORT, () => {
  console.log(`✅ Backend server is running and listening on http://localhost:${PORT}`);
  // A more robust check for critical env vars
  if (!process.env.YELP_API_KEY) {
    console.warn('⚠️ WARNING: YELP_API_KEY is not set. External API features will not work.');
  } else {
    console.log('🔑 Yelp API Key successfully loaded.');
  }
});