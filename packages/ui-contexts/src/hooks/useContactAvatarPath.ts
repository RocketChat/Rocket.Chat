import { useContext } from 'react';

import { AvatarUrlContext, type AvatarUrlContextValue } from '../AvatarUrlContext';

export const useContactAvatarPath = (): AvatarUrlContextValue['getContactPathAvatar'] => useContext(AvatarUrlContext).getContactPathAvatar;
