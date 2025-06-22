// backend/src/__test__/__mocks__/prisma.ts
import { PrismaClient } from '@prisma/client';
import { jest } from '@jest/globals';

// მოვქირავოთ PrismaClient-ის ყველა მეთოდი
const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    // დაამატე სხვა მეთოდები, რომლებიც auth.ts-ში გამოიყენება, თუ საჭიროა
  },
  // დაამატე სხვა მოდელები, რომლებსაც მოქირავებ, მაგ., localItem, userFavorite
};

export default prismaMock as unknown as PrismaClient;