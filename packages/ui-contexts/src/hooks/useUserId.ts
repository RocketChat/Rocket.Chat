import { useContext } from 'react';

import { UserContext } from '../UserContext.js';

export const useUserId = () => useContext(UserContext).userId;
