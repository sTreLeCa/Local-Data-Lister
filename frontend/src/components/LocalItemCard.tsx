import React from 'react';
import type { LocalItem, Restaurant, EventItem, Park } from '@local-data/types'; 
import styles from './LocalItemCard.module.css';

interface LocalItemCardProps {
  item: LocalItem;
}

const LocalItemCard: React.FC<LocalItemCardProps> = ({ item }) => {
  // Helper function to create a displayable address string
  // It gracefully handles missing optional address parts from the MERGED Location type.
  const formatLocationDisplay = (): string => {
    const { street, city, state, zipcode } = item.location;
    const parts: string[] = [];
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zipcode) parts.push(zipcode);
    
    let displayAddress = parts.join(', ');

    // If no street/city/state, maybe show lat/lon as a fallback or for dev
    if (!displayAddress && item.location.latitude && item.location.longitude) {
      displayAddress = `Lat: ${item.location.latitude.toFixed(4)}, Lon: ${item.location.longitude.toFixed(4)}`;
    }
    return displayAddress;
  };

  const displayLocationString = formatLocationDisplay();

  const renderTypeSpecificInfo = () => {
    switch (item.type) {
      case 'restaurant':
        // Type assertion is not strictly needed here due to discriminated union, 
        // but can be kept for explicitness if preferred.
        // const restaurant = item as Restaurant; 
        return (
          <>
            <p className={styles.infoItem}>Cuisine: {item.cuisineType}</p>
            {item.priceRange && <p className={styles.infoItem}>Price Range: {item.priceRange}</p>}
            {/* Rating is now part of BaseItem and displayed below */}
          </>
        );
      case 'event':
        // const eventItem = item as EventItem;
        return (
          <>
            <p className={styles.infoItem}>Event Type: {item.eventType}</p>
            {item.eventDate && (
              <p className={styles.infoItem}>
                Date: {new Date(item.eventDate).toLocaleString()} {/* More user-friendly date/time */}
              </p>
            )}
            {item.price !== undefined && ( // Check for undefined for price since it's optional
              <p className={styles.infoItem}>
                Price: {item.price === 0 ? "Free" : `$${item.price.toFixed(2)}`}
              </p>
            )}
          </>
        );
      case 'park':
        // const parkItem = item as Park;
        return (
          <>
            <p className={styles.infoItem}>Park Type: {item.parkType}</p>
            {item.amenities && item.amenities.length > 0 && (
              <p className={styles.infoItem}>Amenities: {item.amenities.join(', ')}</p>
            )}
          </>
        );
      default:
        // This case makes the switch exhaustive.
        // TypeScript will error here if a new type is added to LocalItem without a case.
        const _exhaustiveCheck: never = item;
        return _exhaustiveCheck; // Or simply return null
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.name}>{item.name}</h3>
      <p className={styles.infoItem}>Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
      
      {/* Common BaseItem fields from the MERGED types */}
      <p className={styles.description}>{item.description}</p>
      {displayLocationString && <p className={styles.infoItem}>Location: {displayLocationString}</p>}
      
      {/* Rating is optional in BaseItem from MERGED types */}
      {item.rating !== undefined && <p className={styles.infoItem}>Rating: {item.rating}/5</p>}
      
      {/* Type-specific information */}
      {renderTypeSpecificInfo()}
    </div>
  );
};

export default LocalItemCard;