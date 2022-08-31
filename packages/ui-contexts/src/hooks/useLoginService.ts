import { useContext, useMemo } from 'react';

import { LoginContext } from '../LoginContext';

export const useLoginService = <T extends { service: string; clientConfig?: unknown }>(service: T): (() => Promise<true>) => {
	const { loginWithService } = useContext(LoginContext);

	return useMemo(() => {
		return loginWithService(service);
	}, [loginWithService, service]);
};
