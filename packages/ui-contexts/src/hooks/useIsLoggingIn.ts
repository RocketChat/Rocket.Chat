import { useContext } from 'react';

import { AuthenticationContext } from '../AuthenticationContext';

export const useIsLoggingIn = () => {
	const { isLoggingIn } = useContext(AuthenticationContext);
	return isLoggingIn;
};
