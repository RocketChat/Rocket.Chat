import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext';

export const useLoginWithPasskey = (): () => Promise<void> => useContext(AuthenticationContext).loginWithPasskey;
