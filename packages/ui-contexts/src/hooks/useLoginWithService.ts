import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';

import { AuthenticationContext } from '../AuthenticationContext.js';

export const useLoginWithService = <T extends LoginServiceConfiguration>(service: T): (() => Promise<true>) => {
	const { loginWithService } = useContext(AuthenticationContext);

	return useMemo(() => {
		return loginWithService(service);
	}, [loginWithService, service]);
};
