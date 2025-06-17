import { useSyncExternalStore } from 'react';

import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginServices = () => {
	const { queryLoginServices } = useAuthenticationContext();

	return useSyncExternalStore(queryLoginServices.subscribe, queryLoginServices.getCurrentValue);
};
