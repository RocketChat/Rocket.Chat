import { useContext, useMemo } from 'react';

import type { LoginService } from '../UserContext';
import { UserContext } from '../UserContext';

export const useLoginWithService = <T extends LoginService>(service: T): (() => Promise<true>) => {
	const { loginWithService } = useContext(UserContext);

	return useMemo(() => {
		return loginWithService(service);
	}, [loginWithService, service]);
};
