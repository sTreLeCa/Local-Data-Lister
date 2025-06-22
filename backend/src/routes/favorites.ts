// backend/src/routes/favorites.ts
import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { LocalItem } from '@local-data/types';
import { getIO } from '../socketManager'; // <--- 1. დაამატე ეს იმპორტი

const router = express.Router();

// Use the Guard for all routes in this file
router.use(authMiddleware);

// --- GET /api/me/favorites ---
// (ეს ენდფოინთი უცვლელი რჩება, რადგან ის მხოლოდ კითხულობს მონაცემებს)
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const userFavorites = await prisma.userFavorite.findMany({
      where: { userId: userId },
      include: { localItem: true },
      orderBy: { favoritedAt: 'desc' }
    });

    const items = userFavorites.map(fav => {
      const { locationJson, ...restOfItem } = fav.localItem;
      return {
          ...restOfItem,
          location: locationJson
      };
    });
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Could not get your favorites.' });
  }
});

// --- POST /api/me/favorites ---
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const itemData = req.body as LocalItem;

  try {
    // Upsert the LocalItem to ensure it exists in our DB
    const upsertedItem = await prisma.localItem.upsert({
      where: { id: itemData.id },
      update: {
        name: itemData.name,
        description: itemData.description,
        locationJson: itemData.location as any, // Prisma expects JsonValue
        imageUrl: itemData.imageUrl,
      },
      create: {
        id: itemData.id,
        name: itemData.name,
        type: itemData.type,
        description: itemData.description,
        locationJson: itemData.location as any, // Prisma expects JsonValue
        imageUrl: itemData.imageUrl,
        sourceApi: itemData.sourceApi || 'unknown',
      },
    });

    // Create the favorite link
    const newFavorite = await prisma.userFavorite.create({
      data: {
        userId: userId,
        localItemId: itemData.id,
      },
    });

    // --- 2. WebSocket event-ის გამოგზავნა ---
    const io = getIO();
    // გავაგზავნოთ სრული ობიექტი, რომელსაც Prisma დააბრუნებს upsert-ის შემდეგ,
    // რათა კლიენტმა მიიღოს ყველაზე განახლებული ინფორმაცია,
    // და დავამატოთ favoritedBy-ის ინფორმაცია, თუ საჭიროა.
    const eventData = {
      userId,
      item: { ...upsertedItem, location: upsertedItem.locationJson }, // დავაბრუნოთ სწორი location სტრუქტურა
      action: 'added'
    };
    io.emit('favoriteUpdate', eventData);
    console.log(`[WS] Emitted 'favoriteUpdate' (added):`, { userId, itemId: itemData.id });

    res.status(201).json(newFavorite);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'You have already favorited this item.' });
    }
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Could not add item to favorites.' });
  }
});

// --- DELETE /api/me/favorites/:itemId ---
router.delete('/:itemId', async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { itemId } = req.params;

    try {
        await prisma.userFavorite.delete({
            where: {
                userId_localItemId: {
                    userId: userId,
                    localItemId: itemId,
                }
            }
        });

        // --- 3. WebSocket event-ის გამოგზავნა ---
        const io = getIO();
        const eventData = { userId, itemId, action: 'removed' };
        io.emit('favoriteUpdate', eventData);
        console.log(`[WS] Emitted 'favoriteUpdate' (removed):`, eventData);

        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'Favorite not found.' });
        }
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Could not remove item from favorites.' });
    }
});

export default router;