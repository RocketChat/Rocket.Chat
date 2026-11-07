import { useContext } from 'react';

import { AvatarUrlContext } from '../AvatarUrlContext.js';

export const useRoomAvatarPath = (): ((...args: any) => string) => useContext(AvatarUrlContext).getRoomPathAvatar;
