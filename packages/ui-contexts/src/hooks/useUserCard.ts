import { useContext } from 'react';

import { UserCardContext } from '../UserCardContext.js';

export const useUserCard = () => useContext(UserCardContext);
