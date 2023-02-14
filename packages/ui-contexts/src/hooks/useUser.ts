import { useContext } from 'react';
import type { IUser } from '@rocket.chat/core-typings';

import { UserContext } from '../UserContext';

export const useUser = (): IUser | null => useContext(UserContext).user;
