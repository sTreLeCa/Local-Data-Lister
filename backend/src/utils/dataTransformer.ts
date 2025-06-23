// backend/src/utils/dataTransformer.ts

import { LocalItem as PrismaLocalItem } from '@prisma/client';

// The shape our frontend expects, which has a 'location' object.
// We can import this from @local-data/types if we want, but defining it here is fine.
interface FrontendLocalItem {
    id: string;
    type: string;
    name: string;
    description: string | null;
    location: any; // The target property
    imageUrl: string | null;
    sourceApi: string;
    // Add any other fields you expect on the frontend
}

type PrismaItemWithLocation = PrismaLocalItem & { location?: any };

/**
 * Safely transforms a LocalItem from Prisma (with locationJson)
 * to a format the frontend expects (with a location object).
 * This function handles all edge cases gracefully.
 *
 * @param item - The item object from the Prisma query result.
 * @returns A frontend-ready item object.
 */
export function transformPrismaItemToFrontend(item: PrismaItemWithLocation): FrontendLocalItem {
    // 1. Destructure the item to separate the JSON field and the rest
    const { locationJson, ...restOfItem } = item;

    // 2. Determine the correct location object
    let finalLocation = {}; // Default to empty object to prevent crashes

    if (locationJson) {
        // If locationJson exists (and is not null), it's our source of truth.
        // It should already be an object because it's a JSON type in Prisma.
        finalLocation = locationJson;
    } else if (restOfItem.location) {
        // If locationJson is missing, but a 'location' property exists, use that.
        // This handles items coming directly from local-items.json.
        finalLocation = restOfItem.location;
    }

    // 3. Return the clean, combined object
    return {
        ...restOfItem,
        location: finalLocation, // The location property is now guaranteed to exist
    };
}