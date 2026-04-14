import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext';

export const useLoginWithToken = () => useContext(AuthenticationContext).loginWithToken;
