import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginToken = (): string | null => useAuthenticationContext().getLoginToken();
