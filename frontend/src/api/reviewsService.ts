// frontend/src/api/reviewsService.ts

// You can define a more specific Review type if you want
export const fetchReviews = async (itemId: string): Promise<any[]> => {
    const response = await fetch(`/api/items/${itemId}/reviews`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
};

export const postReview = async (itemId: string, reviewData: { rating: number; text?: string }, token: string): Promise<any> => {
    const response = await fetch(`/api/items/${itemId}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to post review');
    }
    return response.json();
};