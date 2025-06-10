import React from 'react';
import type { LocalItem, Restaurant, EventItem, Park } from '../types'; 


interface LocalItemCardProps {
  item: LocalItem;
}

const LocalItemCard: React.FC<LocalItemCardProps> = ({ item }) => {
  const renderTypeSpecificInfo = () => {
    switch (item.type) {
      case 'restaurant':
        const restaurant = item as Restaurant; // Type assertion
        return <p>Cuisine: {restaurant.cuisineType}</p>;
      case 'event':
        const eventItem = item as EventItem; // Type assertion
        return <p>Event Type: {eventItem.eventType}</p>;
      case 'park':
        const parkItem = item as Park; // Type assertion
        return <p>Park Type: {parkItem.parkType}</p>;
      default:
        // This should not happen if your LocalItem type is exhaustive
        // You can use an exhaustive check pattern for type safety if desired:
        // const _exhaustiveCheck: never = item;
        return null;
    }
  };

  return (
    <div style={{ border: '1px solid #eee', margin: '10px', padding: '10px', borderRadius: '5px' }}>
      <h2>{item.name}</h2>
      <p>Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
      {renderTypeSpecificInfo()}
      {/* More common fields (location, description) will be added in C-Task 3 */}
    </div>
  );
};

export default LocalItemCard;