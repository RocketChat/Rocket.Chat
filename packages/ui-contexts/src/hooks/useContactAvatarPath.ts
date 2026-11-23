import { useContext } from 'react';

import { AvatarUrlContext, type AvatarUrlContextValue } from '../AvatarUrlContext.js';

export const useContactAvatarPath = (): AvatarUrlContextValue['getContactPathAvatar'] => useContext(AvatarUrlContext).getContactPathAvatar;
