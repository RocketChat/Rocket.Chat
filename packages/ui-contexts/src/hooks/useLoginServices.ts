import { useContext, useMemo, useSyncExternalStore } from 'react';

import { AuthenticationContext, type LoginService } from '../AuthenticationContext';

export const useLoginServices = (): LoginService[] => {
	const { queryLoginServices } = useContext(AuthenticationContext);
	const [subscribe, getSnapshot] = useMemo(() => {
		return [queryLoginServices.subscribe, () => queryLoginServices.getCurrentValue()];
	}, [queryLoginServices]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
