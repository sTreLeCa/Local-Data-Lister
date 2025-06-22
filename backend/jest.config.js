// backend/jest.config.js
module.exports = {
  resetMocks: true,
  preset: 'ts-jest', 
  testEnvironment: 'node', 
  
  // ADD THIS LINE:
  setupFiles: ['./jest.setup.js'],
  
  moduleNameMapper: {
    '^@local-data/types$': '<rootDir>/../packages/types/src/index.ts'
  },
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)', 
    '**/?(*.)+(spec|test).+(ts|tsx|js)' 
  ],
};