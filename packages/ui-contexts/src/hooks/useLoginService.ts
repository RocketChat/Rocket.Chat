import { useContext, useMemo } from 'react';

import type { LoginService } from '../LoginContext';
import { LoginContext } from '../LoginContext';

export const useLoginService = <T extends LoginService>(service: T): (() => Promise<true>) => {
	const { loginWithService } = useContext(LoginContext);

	return useMemo(() => {
		return loginWithService(service);
	}, [loginWithService, service]);
};
