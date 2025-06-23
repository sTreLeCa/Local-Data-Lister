// backend/src/routes/items.ts

import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.localItem.findUniqueOrThrow({
      where: { id },
    });

    // Transform locationJson back to location for frontend consistency
    const { locationJson, ...restOfItem } = item;
    const itemWithLocation = {
        ...restOfItem,
        location: locationJson
    };

    res.status(200).json(itemWithLocation);
  } catch (error) {
    // findUniqueOrThrow throws an error if not found
    res.status(404).json({ message: `Item with ID ${id} not found.` });
  }
});

export default router;