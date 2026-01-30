import { useContext, useSyncExternalStore } from 'react';

import { AuthenticationContext } from '../AuthenticationContext';

export const useLoginServices = () => {
	const { queryLoginServices } = useContext(AuthenticationContext);

	return useSyncExternalStore(queryLoginServices.subscribe, queryLoginServices.getCurrentValue);
};
