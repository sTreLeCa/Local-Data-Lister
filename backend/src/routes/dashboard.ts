// backend/src/routes/dashboard.ts
import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// --- The "Most Popular Items" Door ---
// This is a public route, so we don't need our 'authMiddleware' Guard here.
// Path: GET /api/dashboard/popular-items
router.get('/popular-items', async (req, res) => {
  // Let's allow the frontend to ask for a specific number of items, defaulting to 10.
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    // --- This is the magic part! ---
    // We ask Prisma to do two things at once:
    // 1. Group all the favorites by the item's ID.
    // 2. Count how many times each item ID appears.
    const popularItemsWithCounts = await prisma.userFavorite.groupBy({
      by: ['localItemId'], // Group by the item ID
      _count: {
        localItemId: true, // Count the occurrences of each item ID
      },
      orderBy: {
        _count: {
          localItemId: 'desc', // Sort from most favorites to least
        },
      },
      take: limit, // Only give us the top 'limit' items
    });

    // Now we have a list like: [{ localItemId: 'item-123', _count: { localItemId: 5 } }]
    // We need to get the full details for each of these items.

    // First, let's get just the IDs from our list.
    const popularItemIds = popularItemsWithCounts.map(item => item.localItemId);

    // Now, ask Prisma to find all items whose ID is in our popular list.
    const items = await prisma.localItem.findMany({
      where: {
        id: {
          in: popularItemIds,
        },
      },
    });

    // Finally, let's combine the item details with their favorite counts.
    const finalResult = items.map(item => {
      const countInfo = popularItemsWithCounts.find(p => p.localItemId === item.id);
      return {
        ...item,
        // The frontend will love having this count!
        favoriteCount: countInfo?._count.localItemId || 0,
      };
    }).sort((a, b) => b.favoriteCount - a.favoriteCount); // Re-sort to be safe.

    res.status(200).json(finalResult);

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Could not get popular items.' });
  }
});

export default router;