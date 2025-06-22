import React from 'react';
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
  onToggleFavorite }) => {
  const formatLocationDisplay = (): string => {
    const { street, city, state, zipcode } = item.location;
    const parts: string[] = [];
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zipcode) parts.push(zipcode);
    let displayAddress = parts.join(', ');
    if (!displayAddress && item.location.latitude && item.location.longitude) {
      displayAddress = `Lat: ${item.location.latitude.toFixed(4)}, Lon: ${item.location.longitude.toFixed(4)}`;
    }
    return displayAddress;
  };

  const displayLocationString = formatLocationDisplay();

  const renderTypeSpecificInfo = () => {
    switch (item.type) {
      case 'Restaurant':
        return (
          <>
            <p className={styles.infoItem}>Cuisine: {item.cuisineType}</p>
            {item.priceRange && <p className={styles.infoItem}>Price Range: {item.priceRange}</p>}
          </>
        );
      case 'Event':
        return (
          <>
            <p className={styles.infoItem}>Event Type: {item.eventType}</p>
            {item.startDate && (
              <p className={styles.infoItem}>
                Date: {new Date(item.startDate).toLocaleDateString()}
              </p>
            )}
            {item.ticketPrice !== undefined && (
              <p className={styles.infoItem}>
                Price: {typeof item.ticketPrice === 'number' ? (item.ticketPrice === 0 ? "Free" : `$${item.ticketPrice.toFixed(2)}`) : item.ticketPrice}
              </p>
            )}
          </>
        );
      case 'Park':
        return (
          <>
            <p className={styles.infoItem}>Park Type: {item.parkType}</p>
            {item.amenities && item.amenities.length > 0 && (
              <p className={styles.infoItem}>Amenities: {item.amenities.join(', ')}</p>
            )}
          </>
        );
      default:
        return null; // TypeScript ensures all cases are handled, no need for _exhaustiveCheck
    }
  };

  const mapUrl = `https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}`;

 return (
    <div className={styles.card}>
      {/* --- NEW FAVORITE BUTTON LOGIC --- */}
      {isAuth && onToggleFavorite && (
        <button
          onClick={() => onToggleFavorite(item)}
          className={styles.favoriteButton}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? '❤️' : '🤍'}
        </button>
      )}

      <h3 className={styles.name}>{item.name}</h3>
      {/* ... rest of the JSX is the same ... */}
      <p className={styles.infoItem}>Type: {item.type}</p>
      <p className={styles.description}>{item.description}</p>
      {displayLocationString && <p className={styles.infoItem}>Location: {displayLocationString}</p>}
      {item.rating !== undefined && <p className={styles.infoItem}>Rating: {item.rating}/5</p>}
      {renderTypeSpecificInfo()}
      {item.location.latitude && item.location.longitude && (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
          View on Map
        </a>
      )}
    </div>
  );
};