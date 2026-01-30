import { useContext } from 'react';

import { UserCardContext } from '../UserCardContext';

export const useUserCard = () => useContext(UserCardContext);
