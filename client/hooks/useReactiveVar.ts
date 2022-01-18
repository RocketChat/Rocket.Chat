import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { useEffect, useState } from 'react';

/** @deprecated */
export const useReactiveVar = <T>(variable: ReactiveVar<T>): T => {
	const [value, setValue] = useState(() => Tracker.nonreactive(() => variable.get()));

	useEffect(() => {
		const computation = Tracker.autorun(() => {
			const value = variable.get();
			setValue(() => value);
		});

		return (): void => {
			computation.stop();
		};
	}, [variable]);

	return value;
};
