import { useContext } from 'react';

import type { GetRoomPathAvatar } from '../AvatarUrlContext';
import { AvatarUrlContext } from '../AvatarUrlContext';

export const useRoomAvatarPath = (): GetRoomPathAvatar => useContext(AvatarUrlContext).getRoomPathAvatar;
