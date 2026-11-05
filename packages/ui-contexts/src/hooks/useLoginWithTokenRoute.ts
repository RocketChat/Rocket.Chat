import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useLoginWithTokenRoute = (): ((token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>) =>
	useContext(AuthenticationContext).loginWithTokenRoute;
