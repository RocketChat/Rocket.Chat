import { useContext } from 'react';

import { LoginContext } from '../LoginContext';

export const useLoginWithToken = (): ((token: string) => Promise<void>) => useContext(LoginContext).loginWithToken;
