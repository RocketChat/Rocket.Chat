import { useEffect } from 'react';

import { useFireGlobalEvent } from '../../../hooks/useFireGlobalEvent';

export const useStartupEvent = () => {
	const { mutate: fireStartupEvent } = useFireGlobalEvent('startup', 'global');

	useEffect(() => {
		fireStartupEvent(true);
	}, [fireStartupEvent]);
};
