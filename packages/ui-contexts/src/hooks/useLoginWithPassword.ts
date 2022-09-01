import { useContext } from 'react';

import { LoginContext } from '../LoginContext';

export const useLoginWithPassword = (): ((user: string | object, password: string) => Promise<void>) =>
	useContext(LoginContext).loginWithPassword;
