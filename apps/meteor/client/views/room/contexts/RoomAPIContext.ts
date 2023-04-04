import { createContext } from 'react';

type RoomAPIContextValue = {};

export const RoomAPIContext = createContext<RoomAPIContextValue | undefined>(undefined);
