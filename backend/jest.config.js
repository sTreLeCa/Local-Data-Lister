// backend/jest.config.js
module.exports = {
  preset: 'ts-jest', 
  testEnvironment: 'node', 
  
  moduleNameMapper: {
    '^@local-data/types$': '<rootDir>/../packages/types/src/index.ts'
  },
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)', 
    '**/?(*.)+(spec|test).+(ts|tsx|js)' 
  ],
};