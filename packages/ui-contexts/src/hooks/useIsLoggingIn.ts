import { useAuthenticationContext } from '../AuthenticationContext';

export const useIsLoggingIn = () => {
	const { isLoggingIn } = useAuthenticationContext();
	return isLoggingIn;
};
