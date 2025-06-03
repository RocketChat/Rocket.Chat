import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginWithTokenRoute = (): ((token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>) =>
	useAuthenticationContext().loginWithTokenRoute;
