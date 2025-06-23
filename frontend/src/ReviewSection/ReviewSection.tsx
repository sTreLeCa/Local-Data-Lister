// frontend/src/components/ReviewSection.tsx
import { useEffect, useState } from 'react';
import { fetchReviews, postReview } from '../api/reviewsService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import styles from './ReviewSection.module.css';

export const ReviewSection = ({ itemId }: { itemId: string }) => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [newRating, setNewRating] = useState(5);
    const [newText, setNewText] = useState('');
    const { isAuthenticated, token } = useAuthStore();

    useEffect(() => {
        fetchReviews(itemId).then(setReviews).catch(console.error);
    }, [itemId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        
        // Optimistic UI Update (explained in next step)
        const tempId = Date.now().toString();
        const optimisticReview = { id: tempId, rating: newRating, text: newText, user: { email: 'You' }, createdAt: new Date().toISOString() };
        setReviews(prev => [optimisticReview, ...prev]);
        setNewText('');
        setNewRating(5);

        try {
            const actualReview = await postReview(itemId, { rating: newRating, text: newText }, token);
            // Replace optimistic with real one
            setReviews(prev => prev.map(r => r.id === tempId ? actualReview : r));
            toast.success("Review posted!");
        } catch (error: any) {
            toast.error(error.message);
            // Rollback on error
            setReviews(prev => prev.filter(r => r.id !== tempId));
        }
    };

    return (
        <div className={styles.reviewsSection}>
            <h4>Reviews</h4>
            {isAuthenticated() && (
                <form onSubmit={handleSubmit} className={styles.reviewForm}>
                    <select value={newRating} onChange={e => setNewRating(Number(e.target.value))}>
                        {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                    <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Share your thoughts..." />
                    <button type="submit">Post Review</button>
                </form>
            )}
            {reviews.map(review => (
                <div key={review.id} className={styles.reviewItem}>
                    <p><strong>{review.user.email}</strong> - {review.rating} ★</p>
                    <p>{review.text}</p>
                    <small>{new Date(review.createdAt).toLocaleDateString()}</small>
                </div>
            ))}
        </div>
    );
};