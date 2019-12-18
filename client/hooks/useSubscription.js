import { useEffect, useState } from 'react';

import { useIsMounted } from './useIsMounted';

export const useSubscription = (getInitialValue, subscribe) => {
	const [value, setValue] = useState(getInitialValue);
	const isMounted = useIsMounted();

	useEffect(() => {
		let value = getInitialValue();
		const unsubscribe = subscribe((newValue) => {
			if (!isMounted()) {
				return;
			}

			if (value !== newValue) {
				value = newValue;
				setValue(newValue);
			}
		});

		return () => {
			unsubscribe();
		};
	}, [isMounted, subscribe]);

	return value;
};
