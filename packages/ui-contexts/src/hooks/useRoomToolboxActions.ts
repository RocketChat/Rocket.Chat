import { useContext } from 'react';

import type { RoomToolboxActionsContextValue } from '../RoomToolboxContext';
import { RoomToolboxActionsContext } from '../RoomToolboxContext';

/** Opens and closes room tabs without re-rendering when the room's actions or the open tab change. */
export const useRoomToolboxActions = (): RoomToolboxActionsContextValue => useContext(RoomToolboxActionsContext);
