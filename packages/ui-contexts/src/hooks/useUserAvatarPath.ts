import { useContext } from 'react';

import { AvatarUrlContext, type AvatarUrlContextValue } from '../AvatarUrlContext';

export const useUserAvatarPath = (): AvatarUrlContextValue['getUserPathAvatar'] => useContext(AvatarUrlContext).getUserPathAvatar;
