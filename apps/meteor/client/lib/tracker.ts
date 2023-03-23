import { Tracker } from 'meteor/tracker';

export const asReactiveSource = <T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T) => {
	if (!Tracker.active) {
		return getSnapshot();
	}

	const computation = Tracker.currentComputation;
	const unsubscribe = subscribe(() => computation.invalidate());
	// const id = new Error().stack?.split('\n')[2].trim();
	// console.log('sub', id);
	computation.onInvalidate(() => {
		unsubscribe();
		// console.log('unsub', id);
	});

	return getSnapshot();
};
