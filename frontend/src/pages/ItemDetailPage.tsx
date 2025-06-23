// frontend/src/pages/ItemDetailPage.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { LocalItem } from '@local-data/types';
import { Spinner } from '../components/Spinner/Spinner';
// 👈 IMPORT MAP COMPONENTS
import './ItemDetailPage.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; 

export const ItemDetailPage = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const [item, setItem] = useState<LocalItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!itemId) return;

        const fetchItem = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/items/${itemId}`);
                if (!response.ok) {
                    throw new Error('Item not found');
                }
                const data: LocalItem = await response.json();
                setItem(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItem();
    }, [itemId]);

    if (isLoading) {
        return <Spinner />;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    if (!item) {
        return <div>Item not found.</div>;
    }

    const position: [number, number] = [item.location.latitude, item.location.longitude];

    return (
        <div className="detail-page-container fade-in-item">
            <div className="details-column">
                <h1>{item.name}</h1>
                <p className="description">{item.description}</p>
                {/* More details will go here */}
            </div>
            {/* 👇 REPLACE THE EMPTY DIV WITH THE MAP CONTAINER 👇 */}
            <div className="map-column">
                <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>
                            {item.name}
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
};