import type { IUser } from '@rocket.chat/core-typings';
import { useContext } from 'react';

import { UserContext } from '../UserContext.js';

export const useUser = (): IUser | null => useContext(UserContext).user;
