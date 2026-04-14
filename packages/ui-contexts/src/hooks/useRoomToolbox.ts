import { useContext } from 'react';

import type { RoomToolboxContextValue } from '../RoomToolboxContext';
import { RoomToolboxContext } from '../RoomToolboxContext';

export const useRoomToolbox = (): RoomToolboxContextValue => useContext(RoomToolboxContext);
