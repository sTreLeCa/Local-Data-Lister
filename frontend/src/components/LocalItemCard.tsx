// frontend/src/components/LocalItemCard.tsx

import React, { useRef } from 'react';
import { Link } from 'react-router-dom'; // 👈 IMPORT LINK
import type { LocalItem } from '@local-data/types';
import styles from './LocalItemCard.module.css';

interface LocalItemCardProps {
  item: LocalItem;
  isAuth?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: (item: LocalItem) => void;
}

export const LocalItemCard: React.FC<LocalItemCardProps> = ({ 
  item, 
  isAuth, 
  isFavorited, 
  onToggleFavorite 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    const mouseX = x / width;
    const mouseY = y / height;
    
    const rotateX = (mouseY - 0.5) * -15; // Invert for natural feel
    const rotateY = (mouseX - 0.5) * 20;

    cardRef.current.style.setProperty('--rotateX', `${rotateX}deg`);
    cardRef.current.style.setProperty('--rotateY', `${rotateY}deg`);
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rotateX', '0deg');
    cardRef.current.style.setProperty('--rotateY', '0deg');
  };

  const formatLocationDisplay = (): string => {
    const { street, city, state } = item.location;
    const parts: string[] = [];
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state) parts.push(state);
    return parts.join(', ');
  };

  const renderTypeSpecificInfo = () => {
    switch (item.type) {
      case 'Restaurant':
        return (
          <p className={styles.infoItem}>
            <strong>Cuisine:</strong> {item.cuisineType}
            {item.priceRange && ` | ${item.priceRange}`}
          </p>
        );
      case 'Event':
        return (
          <p className={styles.infoItem}>
            <strong>Event:</strong> {item.eventType} on {new Date(item.startDate).toLocaleDateString()}
          </p>
        );
      case 'Park':
        return (
          <p className={styles.infoItem}>
            <strong>Amenities:</strong> {item.amenities?.join(', ')}
          </p>
        );
      default:
        return null;
    }
  };

  const mapUrl = `https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}`;

  // 👇 RENDER THE ENTIRE CARD AS A LINK, BUT STOP FAVORITE BUTTON CLICKS FROM NAVIGATING
  return (
    <Link to={`/item/${item.id}`} className={styles.cardLink}>
      <div 
        className={styles.card} 
        ref={cardRef} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.cardContent}>
          <h3 className={styles.name}>{item.name}</h3>
          {item.rating && <p className={styles.infoItem}><strong>Rating:</strong> {item.rating}/5</p>}
          {renderTypeSpecificInfo()}
          <p className={styles.description}>{item.description}</p>
          <div className={styles.cardActions}>
            <span className={styles.mapLink}>
              View Details ↗
            </span>
            {isAuth && onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.preventDefault(); // Prevent the Link from navigating
                  e.stopPropagation(); // Stop the event from bubbling up
                  onToggleFavorite(item);
                }}
                className={styles.favoriteButton}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorited ? '❤️' : '🤍'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};