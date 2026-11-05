import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useWipeLocalAuth = (): (() => void) => useContext(AuthenticationContext).wipeLocalAuth;
