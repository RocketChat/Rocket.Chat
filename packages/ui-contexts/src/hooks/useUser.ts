import type { IUser } from '@rocket.chat/core-typings';
import { useContext } from 'react';

import { UserContext } from '../UserContext';

export const useUser = (): IUser | null => useContext(UserContext).user;
