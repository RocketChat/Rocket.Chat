import { useState } from 'react';

import { useAutorun } from './useAutorun';
import { useNonReactiveValue } from './useNonReactiveValue';

export const useReactiveValue = (getValue, deps = []) => {
	const initialValue = useNonReactiveValue(getValue);
	const [value, setValue] = useState(() => initialValue);

	useAutorun(() => {
		const newValue = getValue();
		setValue(() => newValue);
	}, deps);

	return value;
};
