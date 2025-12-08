import { useEffect } from 'react';

import { useFireGlobalEvent } from '../../../hooks/useFireGlobalEvent';

const useStartupEvent = () => {
	const { mutate: fireStartupEvent } = useFireGlobalEvent('startup');

	useEffect(() => {
		fireStartupEvent(true);
	}, [fireStartupEvent]);
};

export default useStartupEvent;
