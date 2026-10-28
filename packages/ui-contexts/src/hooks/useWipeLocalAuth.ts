import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext';

export const useWipeLocalAuth = (): (() => void) => useContext(AuthenticationContext).wipeLocalAuth;
