import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginWithIframe = (): ((token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>) =>
	useAuthenticationContext().loginWithIframe;
