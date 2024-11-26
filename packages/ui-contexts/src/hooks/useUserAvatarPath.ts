import { useContext } from 'react';

import { AvatarUrlContext } from '../AvatarUrlContext';

export const useUserAvatarPath = () => useContext(AvatarUrlContext).getUserPathAvatar;
