import { useAuthenticationContext } from '../AuthenticationContext';

export const useUnstoreLoginToken = (): ((callback: () => void) => () => void) => useAuthenticationContext().unstoreLoginToken;
