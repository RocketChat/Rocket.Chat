import { useContext } from 'react';

import { UserContext } from '../UserContext';

export const useLoginWithToken = (): ((token: string) => Promise<void>) => useContext(UserContext).loginWithToken;
