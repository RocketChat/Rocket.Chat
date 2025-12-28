import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext';

export const useUnstoreLoginToken = (): ((callback: () => void) => () => void) => useContext(AuthenticationContext).unstoreLoginToken;
