import { useContext } from 'react';

import { AvatarUrlContext, type AvatarUrlContextValue } from '../AvatarUrlContext';

export const useRoomAvatarPath = (): AvatarUrlContextValue['getRoomPathAvatar'] => useContext(AvatarUrlContext).getRoomPathAvatar;
