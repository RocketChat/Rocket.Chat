import { Tracker } from 'meteor/tracker';

export const asReactiveSource = <T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T) => {
	if (!Tracker.active) {
		return getSnapshot();
	}

	const computation = Tracker.currentComputation;
	const unsubscribe = subscribe(() => computation?.invalidate());

	computation?.onInvalidate(() => {
		unsubscribe();
	});

	return getSnapshot();
};
