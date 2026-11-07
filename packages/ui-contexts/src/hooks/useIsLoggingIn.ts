import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useIsLoggingIn = () => {
	const { isLoggingIn } = useContext(AuthenticationContext);
	return isLoggingIn;
};
