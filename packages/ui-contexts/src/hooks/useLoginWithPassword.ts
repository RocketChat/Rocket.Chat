import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext';

export const useLoginWithPassword = (): ((
	user: string | { username: string } | { email: string } | { id: string },
	password: string,
) => Promise<void>) => useContext(AuthenticationContext).loginWithPassword;
