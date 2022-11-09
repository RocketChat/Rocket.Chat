import { useContext } from 'react';

import { UserContext } from '../UserContext';

export const useLoginWithPassword = (): ((user: string | object, password: string) => Promise<void>) =>
	useContext(UserContext).loginWithPassword;
