import { useContext } from 'react';

import type { RoomToolboxContextValue } from '../RoomToolboxContext.js';
import { RoomToolboxContext } from '../RoomToolboxContext.js';

export const useRoomToolbox = (): RoomToolboxContextValue => useContext(RoomToolboxContext);
