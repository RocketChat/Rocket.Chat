import { useEffect, useRef, useState } from 'react';

export const useSubscription = (getInitialValue, subscribe) => {
	const [value, setValue] = useState(getInitialValue);
	const mounted = useRef(true);

	useEffect(() => {
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, [mounted]);

	useEffect(() => {
		let value = getInitialValue();
		const unsubscribe = subscribe((newValue) => {
			if (!mounted.current) {
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
	}, [mounted, subscribe]);

	return value;
};
