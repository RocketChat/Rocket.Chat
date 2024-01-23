import { useContext, useMemo } from 'react';

import type { LoginService } from '../AuthenticationContext';
import { AuthenticationContext } from '../AuthenticationContext';

export const useLoginWithService = <T extends LoginService>(service: T): (() => Promise<true>) => {
	const { loginWithService } = useContext(AuthenticationContext);

	return useMemo(() => {
		return loginWithService(service);
	}, [loginWithService, service]);
};
