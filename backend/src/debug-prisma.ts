// Add this temporarily to debug what's available in your Prisma client
// backend/src/debug-prisma.ts

import prisma from './lib/prisma';

console.log('Available Prisma models:', Object.keys(prisma));
console.log('Prisma client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(prisma)));

// Check if review exists (case-sensitive)
console.log('Has review (lowercase):', 'review' in prisma);
console.log('Has Review (uppercase):', 'Review' in prisma);