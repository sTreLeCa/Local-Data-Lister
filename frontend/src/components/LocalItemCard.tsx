import React from 'react';
import type { LocalItem } from '@local-data/types';
import styles from './LocalItemCard.module.css';

interface LocalItemCardProps {
  item: LocalItem;
}

export const LocalItemCard: React.FC<LocalItemCardProps> = ({ item }) => {
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
      case 'restaurant':
        return (
          <>
            <p className={styles.infoItem}>Cuisine: {item.cuisineType}</p>
            {item.priceRange && <p className={styles.infoItem}>Price Range: {item.priceRange}</p>}
          </>
        );
      case 'event':
        return (
          <>
            <p className={styles.infoItem}>Event Type: {item.eventType}</p>
            {item.eventDate && (
              <p className={styles.infoItem}>
                Date: {new Date(item.eventDate).toLocaleDateString()}
              </p>
            )}
            {item.price !== undefined && (
              <p className={styles.infoItem}>
                Price: {item.price === 0 ? "Free" : `$${item.price.toFixed(2)}`}
              </p>
            )}
          </>
        );
      case 'park':
        return (
          <>
            <p className={styles.infoItem}>Park Type: {item.parkType}</p>
            {item.amenities && item.amenities.length > 0 && (
              <p className={styles.infoItem}>Amenities: {item.amenities.join(', ')}</p>
            )}
          </>
        );
      default:
        const _exhaustiveCheck: never = item;
        return _exhaustiveCheck;
    }
  };
  
  // --- NEW: Construct the Google Maps URL ---
  const mapUrl = `https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}`;

  return (
    <div className={styles.card}>
      <h3 className={styles.name}>{item.name}</h3>
      <p className={styles.infoItem}>Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
      <p className={styles.description}>{item.description}</p>
      {displayLocationString && <p className={styles.infoItem}>Location: {displayLocationString}</p>}
      {item.rating !== undefined && <p className={styles.infoItem}>Rating: {item.rating}/5</p>}
      
      {/* Renders all the correct, detailed type-specific info */}
      {renderTypeSpecificInfo()}

      {/* --- NEW: The map link itself --- */}
      {/* It only renders if we have latitude and longitude */}
      {item.location.latitude && item.location.longitude && (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
          View on Map
        </a>
      )}
    </div>
  );
};