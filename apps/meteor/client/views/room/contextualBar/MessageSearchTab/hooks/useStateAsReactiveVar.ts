import type { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';

export const useStateAsReactiveVar = <T>([value, setValue]: [value: T, setValue: Dispatch<SetStateAction<T>>]): ReactiveVar<T> => {
	const ref = useRef({
		value,
		setValue,
		dep: new Tracker.Dependency(),
	});
	ref.current.value = value;
	ref.current.setValue = setValue;

	const { current: reactiveVar } = useRef<ReactiveVar<T>>({
		get() {
			ref.current.dep.depend();
			return ref.current.value;
		},
		set(newValue) {
			ref.current.value = newValue;
			ref.current.setValue(newValue);
		},
	});

	useEffect(() => {
		ref.current.dep.changed();
	}, [value]);

	return reactiveVar;
};
