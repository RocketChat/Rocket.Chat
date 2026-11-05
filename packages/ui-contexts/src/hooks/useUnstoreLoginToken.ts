import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useUnstoreLoginToken = (): ((callback: () => void) => () => void) => useContext(AuthenticationContext).unstoreLoginToken;
