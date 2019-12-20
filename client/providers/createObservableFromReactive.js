import { Tracker } from 'meteor/tracker';

export const createObservableFromReactive = (fn) => (...fnArgs) => {
	const args = fnArgs.slice(0, -1);
	const listener = fnArgs.pop();

	if (!listener) {
		return Tracker.nonreactive(() => fn(...args));
	}

	const computation = Tracker.autorun(() => {
		const value = fn(...args);
		listener(value);
	});

	return () => {
		computation.stop();
	};
};
