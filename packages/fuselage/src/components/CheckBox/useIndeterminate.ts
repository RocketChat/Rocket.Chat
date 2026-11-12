import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent } from 'react';
import { useLayoutEffect, useRef, useCallback } from 'react';

import type { InputAttributes } from '../../types/ElementAttributes';

/** Keeps the native input's `indeterminate` in step with the prop, which a click would otherwise clear. */
export const useIndeterminate = (
	indeterminate: boolean | undefined,
	ref: InputAttributes['ref'],
	onChange: InputAttributes['onChange'],
) => {
	const innerRef = useRef<HTMLInputElement>(null);
	const mergedRef = useMergedRefs(ref, innerRef);

	useLayoutEffect(() => {
		if (innerRef && innerRef.current && indeterminate !== undefined) {
			innerRef.current.indeterminate = indeterminate;
		}
	}, [innerRef, indeterminate]);

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			if (innerRef && innerRef.current && indeterminate !== undefined) {
				innerRef.current.indeterminate = indeterminate;
			}
			onChange?.call(innerRef.current, event);
		},
		[innerRef, indeterminate, onChange],
	);

	return { ref: mergedRef, onChange: handleChange };
};
