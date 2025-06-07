import type { IUserInfo } from '@rocket.chat/core-typings';
import { useContext } from 'react';

import { UserContext } from '../UserContext';

export const useUser = (): IUserInfo | null => useContext(UserContext).user;
