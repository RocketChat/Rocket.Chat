import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext';

export const useLoginWithToken = (): ((token: string) => Promise<void>) => useContext(AuthenticationContext).loginWithToken;
