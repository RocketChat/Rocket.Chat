import { useContext } from 'react';

import { AvatarUrlContext } from '../AvatarUrlContext';

export const useUserAvatarPath = (): ((uid: string, etag?: string) => string) => useContext(AvatarUrlContext).getUserPathAvatar;
