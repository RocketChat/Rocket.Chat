import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useLoginWithPassword = () => useContext(AuthenticationContext).loginWithPassword;
