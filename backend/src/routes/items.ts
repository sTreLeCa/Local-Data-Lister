// backend/src/routes/items.ts
import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.localItem.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({ message: `Item with ID ${id} not found.` });
    }

    // Transform locationJson back to location for frontend consistency
    const { locationJson, ...restOfItem } = item;
    const itemWithLocation = {
        ...restOfItem,
        location: locationJson,
    };

    res.status(200).json(itemWithLocation);
  } catch (error) {
    console.error(`Error fetching item with ID ${id}:`, error);
    res.status(500).json({ message: 'Internal server error while fetching item.' });
  }
});

export default router;