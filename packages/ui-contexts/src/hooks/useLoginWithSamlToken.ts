import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useLoginWithSamlToken = (): ((token: string, callback?: (error?: unknown) => void) => Promise<unknown>) =>
	useContext(AuthenticationContext).loginWithSamlToken;
