import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, ChangeEventHandler, Ref } from 'react';
import { useLayoutEffect, useRef, useCallback } from 'react';

/** Keeps the native input's `indeterminate` in step with the prop, which a click would otherwise clear. */
export const useIndeterminate = (
	indeterminate: boolean | undefined,
	ref: Ref<HTMLInputElement> | undefined,
	onChange: ChangeEventHandler<HTMLInputElement> | undefined,
) => {
	const innerRef = useRef<HTMLInputElement>(null);
	const mergedRef = useMergedRefs(ref, innerRef);

	useLayoutEffect(() => {
		if (innerRef?.current && indeterminate !== undefined) {
			innerRef.current.indeterminate = indeterminate;
		}
	}, [innerRef, indeterminate]);

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			if (innerRef?.current && indeterminate !== undefined) {
				innerRef.current.indeterminate = indeterminate;
			}
			onChange?.call(innerRef.current, event);
		},
		[innerRef, indeterminate, onChange],
	);

	return { ref: mergedRef, onChange: handleChange };
};
