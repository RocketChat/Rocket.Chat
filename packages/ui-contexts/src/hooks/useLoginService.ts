import { useContext, useMemo } from 'react';

import { LoginContext, LoginService } from '../LoginContext';

export const useLoginService = <T extends LoginService>(service: T): (() => Promise<true>) => {
	const { loginWithService } = useContext(LoginContext);

	return useMemo(() => {
		return loginWithService(service);
	}, [loginWithService, service]);
};
