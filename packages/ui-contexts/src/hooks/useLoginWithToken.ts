import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginWithToken = () => useAuthenticationContext().loginWithToken;
