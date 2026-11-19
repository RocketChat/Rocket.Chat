import { useContext } from 'react';

import { AvatarUrlContext, type AvatarUrlContextValue } from '../AvatarUrlContext.js';

export const useUserAvatarPath = (): AvatarUrlContextValue['getUserPathAvatar'] => useContext(AvatarUrlContext).getUserPathAvatar;
