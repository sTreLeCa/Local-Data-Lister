// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  moduleNameMapper: {
    '^@local-data/types$': '<rootDir>/../packages/types/src/index.ts',
  },
  resetMocks: true, // ეს დავტოვოთ
};