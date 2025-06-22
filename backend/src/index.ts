// backend/src/index.ts
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file FIRST!

import http from 'http'; // 1. დავამატოთ Node.js-ის http მოდული
import app from './server';
import { initSocket } from './socketManager'; // 2. დავამატოთ ჩვენი Socket Manager-ის იმპორტი

const PORT = process.env.PORT || 4000;

// --- 3. შევქმნათ http სერვერი Express აპლიკაციიდან ---
const httpServer = http.createServer(app);

// --- 4. მოვახდინოთ Socket.IO-ს ინიციალიზაცია ამ http სერვერზე ---
initSocket(httpServer);

// Startup validation function for better organization
const validateEnvironment = (): void => {
  // 5. შევცვალოთ შესამოწმებელი ცვლადები
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'FOURSQUARE_API_KEY'];
  const missingVars: string[] = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error(`❌ FATAL ERROR: The following required environment variables are not set: ${missingVars.join(', ')}`);
    console.error('   Please create or check your .env file in the /backend directory.');
    process.exit(1); // გავაჩეროთ აპლიკაცია, თუ კრიტიკული ცვლადები აკლია
  }
};

// 6. გავუშვათ httpServer და არა app.listen()
httpServer.listen(PORT, () => {
  console.log(`✅ Backend server is running and listening on http://localhost:${PORT}`);

  // გავუშვათ ვალიდაცია
  validateEnvironment();
  
  // 7. განვაახლოთ ლოგები, რომ ასახავდეს რეალურ მდგომარეობას
  // Optional: Log partial key for confirmation without exposing the full key
  const fsqKey = process.env.FOURSQUARE_API_KEY!; // '!' ნიშნავს, რომ დარწმუნებულები ვართ, რომ არსებობს validateEnvironment-ის შემდეგ
  const keyPreview = fsqKey.length > 8 ? `${fsqKey.substring(0, 4)}...${fsqKey.substring(fsqKey.length - 4)}` : '[key too short]';
  console.log(`🔑 Foursquare API Key loaded successfully (key: ${keyPreview}).`);
  
  // Additional startup info
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /                     - Health check`);
  console.log(`   GET  /api/local-items      - Local JSON data (for testing)`);
  console.log(`   GET  /api/external/items   - External Foursquare API data (with caching)`);
  console.log(`   POST /api/auth/register    - User Registration`);
  console.log(`   POST /api/auth/login       - User Login`);
  console.log(`   GET  /api/me/favorites     - Get User's Favorites (Auth required)`);
  console.log(`   POST /api/me/favorites     - Add a Favorite (Auth required)`);
  console.log(`   DELETE /api/me/favorites/:itemId - Remove a Favorite (Auth required)`);
  console.log(`   GET  /api/dashboard/popular-items - Get Most Popular Items`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`   GET  /api/test-foursquare  - Foursquare API test endpoint (dev only)`);
  }
});