// backend/src/routes/favorites.ts
import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth'; // Import our authentication "Guard"
import type { LocalItem } from '@local-data/types';
import { getIO } from '../socketManager'; // Import the function to get our Socket.IO instance

const router = express.Router();

// Apply the authentication middleware to ALL routes defined in this file.
// This means a user must provide a valid JWT to access any of these endpoints.
router.use(authMiddleware);

/**
 * @route   GET /api/me/favorites
 * @desc    Get all favorited items for the currently authenticated user.
 * @access  Private
 */
router.get('/', async (req: AuthRequest, res) => {
  // We can safely use `req.user` because the `authMiddleware` guarantees it exists.
  const userId = req.user!.id; 

  try {
    // Fetch all favorites from the database for this specific user.
    const userFavorites = await prisma.userFavorite.findMany({
      where: { userId: userId },
      // `include` tells Prisma to also fetch the related `LocalItem` details for each favorite.
      include: { localItem: true },
      // Order the results by when they were favorited, newest first.
      orderBy: { favoritedAt: 'desc' }
    });

    // The database returns a list of `UserFavorite` objects, which include the `localItem`.
    // We only want to send the `localItem` part to the frontend.
    // Also, we transform the `locationJson` field back into a `location` field.
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
    res.status(500).json({ message: 'Could not retrieve your favorites.' });
  }
});

/**
 * @route   POST /api/me/favorites
 * @desc    Add an item to the user's favorites list.
 * @access  Private
 */
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const itemData = req.body as LocalItem; // The frontend sends the full item object.
  const io = (req as any).io; // Get the Socket.IO instance attached by our middleware.

  try {
    // To avoid duplicating item data, we use `upsert`.
    // If an item with this ID already exists in our `LocalItem` table, it does nothing.
    // If it's a new item, it creates a record for it.
    const upsertedItem = await prisma.localItem.upsert({
      where: { id: itemData.id },
      update: { // If the item exists, we could update its fields here if needed.
        name: itemData.name,
        description: itemData.description,
        imageUrl: itemData.imageUrl,
      },
      create: { // If the item is new, create it with all its data.
        id: itemData.id,
        name: itemData.name,
        type: itemData.type,
        description: itemData.description,
        locationJson: itemData.location as any, // Prisma expects a specific JsonValue type.
        imageUrl: itemData.imageUrl,
        sourceApi: itemData.sourceApi || 'unknown',
      },
    });

    // Now, create the link between the user and the item in the `UserFavorite` table.
    const newFavorite = await prisma.userFavorite.create({
      data: {
        userId: userId,
        localItemId: itemData.id,
      },
    });

    // --- Emit a WebSocket event to all connected clients ---
    if (io) {
      const eventData = {
        userId,
        item: { ...upsertedItem, location: upsertedItem.locationJson }, // Send the full, updated item data.
        action: 'added' as const // Use 'as const' for strict typing on the action.
      };
      io.emit('favoriteUpdate', eventData);
      console.log(`[WS] Emitted 'favoriteUpdate' (added):`, { userId, itemId: itemData.id });
    }

    res.status(201).json(newFavorite);
  } catch (error: any) {
    // Prisma throws a specific error (P2002) if we try to create a duplicate primary key.
    // This happens if the user tries to favorite an item they already have favorited.
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'You have already favorited this item.' });
    }
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Could not add item to favorites.' });
  }
});

/**
 * @route   DELETE /api/me/favorites/:itemId
 * @desc    Remove an item from the user's favorites list.
 * @access  Private
 */
router.delete('/:itemId', async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { itemId } = req.params; // Get the item's ID from the URL.
    const io = (req as any).io; // Get the Socket.IO instance.

    try {
        // Delete the specific link between the user and the item.
        // The `userId_localItemId` is the compound primary key we defined in schema.prisma.
        await prisma.userFavorite.delete({
            where: {
                userId_localItemId: {
                    userId: userId,
                    localItemId: itemId,
                }
            }
        });

        // --- Emit a WebSocket event to notify clients of the removal ---
        if (io) {
          const eventData = { userId, itemId, action: 'removed' as const };
          io.emit('favoriteUpdate', eventData);
          console.log(`[WS] Emitted 'favoriteUpdate' (removed):`, eventData);
        }

        // Return 204 No Content, a standard response for a successful DELETE with no body.
        res.status(204).send(); 
    } catch (error: any) {
        // Prisma throws error P2025 if the record to be deleted doesn't exist.
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'Favorite not found.' });
        }
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Could not remove item from favorites.' });
    }
});

export default router;