// backend/src/routes/reviews.ts

import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ParamsDictionary } from 'express-serve-static-core';
import type { LocalItem } from '@local-data/types'; // Make sure this is imported

// Define an interface for our expected route parameters.
// This tells TypeScript that any request using this will have an `itemId`.
interface ReviewParams extends ParamsDictionary {
  itemId: string;
}

// Create custom Request types that include our specific parameters.
// This is best practice for type-safe Express routing.

// For routes that do NOT require authentication
interface PublicReviewRequest extends Request<ReviewParams, {}, {}, {}> {}

// For routes that DO require authentication (it extends our existing AuthRequest)
interface AuthReviewRequest extends AuthRequest {
  params: ReviewParams;
}

// Initialize the router. `mergeParams: true` is crucial for accessing
// `:itemId` from the parent router defined in `server.ts`.
const router = express.Router({ mergeParams: true });

/**
 * @route   GET /api/items/:itemId/reviews
 * @desc    Get all reviews for a specific local item
 * @access  Public
 */
router.get('/', async (req: PublicReviewRequest, res: Response) => {
    // TypeScript now knows `req.params` has an `itemId` property.
    const { itemId } = req.params;
    
    // --- START: NEW VALIDATION ---
    if (!itemId) {
        return res.status(400).json({ message: 'Item ID is required in the URL path.' });
    }
    // --- END: NEW VALIDATION ---
    
    try {
        const reviews = await prisma.review.findMany({
            where: { localItemId: itemId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    // Only select public user info to avoid sending sensitive data
                    select: { id: true, email: true } 
                }
            }
        });
        res.status(200).json(reviews);
    } catch (error) {
        console.error(`Error fetching reviews for item ${itemId}:`, error);
        res.status(500).json({ message: 'Failed to fetch reviews.' });
    }
});

/**
 * @route   POST /api/items/:itemId/reviews
 * @desc    Create a new review for a local item
 * @access  Private (Requires authentication)
 */
router.post('/', authMiddleware, async (req: AuthReviewRequest, res: Response) => {
    const { itemId } = req.params;
    const userId = req.user!.id;
    // We expect the full item object to be sent from the frontend now
    const { rating, text, item } = req.body;
    
    // --- START: NEW VALIDATION BLOCK ---
    if (!item || !item.id || !item.name || !item.type) {
        return res.status(400).json({ 
            message: 'Item data is required and must include id, name, and type.' 
        });
    }
    const itemData = item as LocalItem;
    // --- END: NEW VALIDATION BLOCK ---

    // Input validation for the rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'A rating between 1 and 5 is required.' });
    }

    try {
        // STEP 1: Ensure the LocalItem exists in our database.
        // If it doesn't, create it. If it does, update it with the latest data.
        await prisma.localItem.upsert({
            where: { id: itemData.id },
            update: { 
                name: itemData.name,
                type: itemData.type,
                description: itemData.description,
                locationJson: itemData.location as any, // Cast to 'any' for Prisma's Json type
                imageUrl: itemData.imageUrl,
                sourceApi: itemData.sourceApi || 'foursquare',
            },
            create: {
                id: itemData.id,
                name: itemData.name,
                type: itemData.type,
                description: itemData.description,
                locationJson: itemData.location as any, // Cast to 'any' for Prisma's Json type
                imageUrl: itemData.imageUrl,
                sourceApi: itemData.sourceApi || 'foursquare',
            },
        });

        // STEP 2: Now that the item is guaranteed to exist, create the review.
        const newReview = await prisma.review.create({
            data: {
                rating,
                text,
                localItemId: itemId,
                userId: userId,
            },
            include: { user: { select: { id: true, email: true } } }
        });
        res.status(201).json(newReview);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'You have already reviewed this item.' });
        }
        console.error(`Error posting review for item ${itemId} by user ${userId}:`, error);
        res.status(500).json({ message: 'An unexpected error occurred while posting the review.' });
    }
});

export default router;