import { useMemo, useSyncExternalStore } from 'react';

import { useAuthenticationContext } from '../AuthenticationContext';

export const useLoginServices = () => {
	const { queryLoginServices } = useAuthenticationContext();

	const [subscribe, getSnapshot] = useMemo(() => queryLoginServices(), [queryLoginServices]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
