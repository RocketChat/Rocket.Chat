import { useEffect, useState } from 'react';

import { useIsMounted } from './useIsMounted';

export const useObservableValue = (getInitialValue, subscribe) => {
	const [value, setValue] = useState(getInitialValue);
	const isMounted = useIsMounted();

	useEffect(() => {
		let oldValue = value;
		const listener = (newValue) => {
			if (!isMounted()) {
				return;
			}

			if (oldValue !== newValue) {
				oldValue = newValue;
				setValue(newValue);
			}
		};

		return subscribe(listener);
	}, [isMounted, subscribe]);

	return value;
};
