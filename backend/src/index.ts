// backend/src/index.ts
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import app from './server';

const PORT = process.env.PORT || 4000;

// Startup validation function for better organization
const validateEnvironment = (): void => {
  const requiredEnvVars = ['YELP_API_KEY'];
  const missingVars: string[] = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ WARNING: The following environment variables are not set: ${missingVars.join(', ')}`);
    console.warn('   External API features (/api/external/items) will not work properly.');
    console.warn('   Please check your .env file configuration.');
  }
};

app.listen(PORT, () => {
  console.log(`✅ Backend server is running and listening on http://localhost:${PORT}`);
  
  // Environment validation
  if (!process.env.YELP_API_KEY) {
    console.warn('⚠️ WARNING: YELP_API_KEY is not set in the .env file. External API features (/api/external/items) will not work.');
  } else {
    // Optional: Log partial key for confirmation without exposing the full key
    const keyPreview = process.env.YELP_API_KEY.length > 4 
      ? `${process.env.YELP_API_KEY.substring(0, 4)}...` 
      : '[key too short]';
    console.log(`🔑 Yelp API Key loaded successfully (starts with: ${keyPreview}).`);
  }
  
  // Additional startup info
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /                     - Health check`);
  console.log(`   GET  /api/local-items      - Local JSON data`);
  console.log(`   GET  /api/external/items   - External Yelp API data`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`   GET  /api/test-yelp        - Yelp API test endpoint (dev only)`);
  }
});