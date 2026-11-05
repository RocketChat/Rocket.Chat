import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useLoginToken = (): string | null => useContext(AuthenticationContext).getLoginToken();
