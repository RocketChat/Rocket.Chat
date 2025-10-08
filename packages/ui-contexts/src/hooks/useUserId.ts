import { useContext } from 'react';

import { UserContext } from '../UserContext';

export const useUserId = () => useContext(UserContext).userId;
