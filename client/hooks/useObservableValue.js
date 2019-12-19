import { useEffect, useState } from 'react';

export const useObservableValue = (getValue) => {
	const [value, setValue] = useState(() => getValue());

	useEffect(() => {
		let mounted = true;

		const unsubscribe = getValue((newValue) => {
			if (mounted) {
				setValue(newValue);
			}
		});

		return () => {
			mounted = false;
			unsubscribe();
		};
	}, [getValue, name]);

	return value;
};
