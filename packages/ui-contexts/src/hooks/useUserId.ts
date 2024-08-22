import { useContext } from 'react';

import { UserContext } from '../UserContext';

export const useUserId = (): string | null => useContext(UserContext).userId;
