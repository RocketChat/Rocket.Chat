import { Tracker } from 'meteor/tracker';
import { useEffect } from 'react';

export const useAutorun = (autorunFunction, deps = []) => {
	useEffect(() => {
		const computation = Tracker.autorun(autorunFunction);

		return () => {
			computation.stop();
		};
	}, deps);
};
