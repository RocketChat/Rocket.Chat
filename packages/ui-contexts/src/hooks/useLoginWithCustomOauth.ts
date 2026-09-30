import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginWithCustomOauth = () => useAuthenticationContext().loginWithCustomOauth;
