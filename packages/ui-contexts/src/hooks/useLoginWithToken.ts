import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useLoginWithToken = () => useContext(AuthenticationContext).loginWithToken;
