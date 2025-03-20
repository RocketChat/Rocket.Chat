import { useContext } from 'react';

import { AvatarUrlContext } from '../AvatarUrlContext';

export const useRoomAvatarPath = (): ((...args: any) => string) => useContext(AvatarUrlContext).getRoomPathAvatar;
