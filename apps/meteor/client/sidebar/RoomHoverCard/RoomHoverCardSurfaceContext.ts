import { createContext, useContext } from 'react';

type SurfaceRef = (element: HTMLElement | null) => (() => void) | undefined;

/**
 * Marks an element rendered outside the card (a popover it opens) as part of it: the pointer on it keeps the card
 * open, and leaving it counts as leaving the card.
 */
export const RoomHoverCardSurfaceContext = createContext<SurfaceRef>(() => undefined);

export const useRoomHoverCardSurface = () => useContext(RoomHoverCardSurfaceContext);
