import { Tracker } from 'meteor/tracker';
import { useCallback } from 'react';

import { useObservableValue } from './useObservableValue';

export const useReactiveValue = (getValue, deps = []) => {
	const getInitialValue = () => Tracker.nonreactive(getValue);

	const subscribe = useCallback((fn) => {
		const computation = Tracker.autorun((c) => {
			const value = getValue();
			if (!c.firstRun) {
				fn(value);
			}
		});

		return () => {
			computation.stop();
		};
	}, deps);

	return useObservableValue(getInitialValue, subscribe);
};

// export const useReactiveValue = (getValue, deps = []) => {
// 	const [value, setValue] = useState(() => Tracker.nonreactive(getValue));

// 	useEffect(() => {
// 		let oldValue = value;
// 		const computation = Tracker.autorun(() => {
// 			const newValue = getValue();
// 			if (newValue !== oldValue) {
// 				oldValue = newValue;
// 				setValue(newValue);
// 			}
// 		});

// 		return () => {
// 			computation.stop();
// 		};
// 	}, deps);

// 	return value;
// };
