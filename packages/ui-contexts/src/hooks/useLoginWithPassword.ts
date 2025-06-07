import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginWithPassword = () => useAuthenticationContext().loginWithPassword;
