import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginWithService = <T extends LoginServiceConfiguration>(service: T): (() => Promise<true>) => {
	const { loginWithService } = useAuthenticationContext();

	return useMemo(() => {
		return loginWithService(service);
	}, [loginWithService, service]);
};
