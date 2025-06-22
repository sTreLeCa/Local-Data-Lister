// backend/src/routes/favorites.ts
import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth'; // Import our Guard
import type { LocalItem } from '@local-data/types'; // Import the shared type for items

const router = express.Router();

// Use the Guard for every door in this hallway! This protects all the routes below.
router.use(authMiddleware);

// --- Door 1: Get the list of my favorite items ---
// Path: GET /api/me/favorites
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id; // We know req.user exists because the Guard checked it.

  try {
    const userFavorites = await prisma.userFavorite.findMany({
      where: { userId: userId },
      include: { localItem: true }, // Also get the full details of the item
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
    res.status(500).json({ message: 'Could not get your favorites.' });
  }
});

// --- Door 2: Add a new favorite item ---
// Path: POST /api/me/favorites
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const itemData = req.body as LocalItem; // The user will send the full item object

  try {
    // First, make sure we have a copy of this item in our own database.
    // `upsert` creates it if it's new, or does nothing if it exists.
    await prisma.localItem.upsert({
      where: { id: itemData.id },
      update: {},
      create: {
        id: itemData.id,
        name: itemData.name,
        type: itemData.type,
        description: itemData.description,
        locationJson: itemData.location as any,
        imageUrl: itemData.imageUrl,
        sourceApi: itemData.sourceApi || 'unknown',
      },
    });

    // Now, link the user to the item in our special list
    const newFavorite = await prisma.userFavorite.create({
      data: {
        userId: userId,
        localItemId: itemData.id,
      },
    });
    res.status(201).json(newFavorite);
  } catch (error: any) {
    // This error (P2002) happens if they try to favorite the same item twice.
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'You have already favorited this item.' });
    }
    res.status(500).json({ message: 'Could not add item to favorites.' });
  }
});

// --- Door 3: Remove an item from favorites ---
// Path: DELETE /api/me/favorites/:itemId
router.delete('/:itemId', async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { itemId } = req.params; // Get the item's ID from the URL

    try {
        await prisma.userFavorite.delete({
            where: {
                userId_localItemId: { // This finds the exact favorite link to delete
                    userId: userId,
                    localItemId: itemId,
                }
            }
        });
        res.status(204).send(); // This means "I did it, and there's nothing to say."
    } catch (error: any) {
        // This error (P2025) happens if the favorite they try to delete doesn't exist.
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'Favorite not found.' });
        }
        res.status(500).json({ message: 'Could not remove item from favorites.' });
    }
});

export default router;