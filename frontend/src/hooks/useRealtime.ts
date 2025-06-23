import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';


export interface FavoriteUpdateData {
  action: 'added' | 'removed';
  userId: string;
  itemId: string;
  item?: any; 
}

// The backend server URL. In development, it's on the same host.
const SERVER_URL = 'http://localhost:4000';

let socket: Socket;
// It will call this function whenever a 'favoriteUpdate' event is received.
export const useRealtime = (onFavoriteUpdate: (data: FavoriteUpdateData) => void) => {
  useEffect(() => {
    socket = io(SERVER_URL);
    console.log('[WS] Connecting to WebSocket server...');

    socket.on('connect', () => {
        console.log(`[WS] Connected with socket ID: ${socket.id}`);
    });

    // --- Event Listener ---
    socket.on('favoriteUpdate', (data: FavoriteUpdateData) => {
      console.log('[WS] Received "favoriteUpdate" event:', data);
      onFavoriteUpdate(data);
    });

    // --- Cleanup function ---
    return () => {
      if(socket) {
        console.log('[WS] Disconnecting socket...');
        socket.off('favoriteUpdate'); // Remove the specific event listener
        socket.disconnect();
      }
    };
  }, [onFavoriteUpdate]); // The dependency array ensures the effect re-runs if the callback function changes.
};