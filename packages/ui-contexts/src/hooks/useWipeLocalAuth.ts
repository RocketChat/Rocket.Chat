import { useAuthenticationContext } from '../AuthenticationContext';

export const useWipeLocalAuth = (): (() => void) => useAuthenticationContext().wipeLocalAuth;
