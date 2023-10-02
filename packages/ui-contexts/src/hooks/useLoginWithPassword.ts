import { useContext } from 'react';

import { UserContext } from '../UserContext';

export const useLoginWithPassword = (): ((
	user: string | { username: string } | { email: string } | { id: string },
	password: string,
) => Promise<void>) => useContext(UserContext).loginWithPassword;
