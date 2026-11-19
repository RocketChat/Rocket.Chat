import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useLayoutEffect, useRef, useCallback } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type CheckBoxProps = ElementProps<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>> & {
	/**
	 * Shows a dash instead of a check, whatever `checked` says, for a checkbox that controls a partly selected group.
	 * Clicking doesn't clear it: update the prop instead.
	 */
	indeterminate?: boolean;
	/**
	 * Placed inside the control's own `label`, which names it. Use visually hidden text when the visible label is
	 * elsewhere.
	 */
	labelChildren?: ReactNode;
};

/**
 * Selects any number of options from a list, or opts in to a single one.
 */
function CheckBox({ ref, indeterminate, onChange, className, labelChildren, ...props }: CheckBoxProps) {
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

	return (
		<Box is='label' className={className} rcx-check-box>
			{labelChildren}
			<Box is='input' type='checkbox' rcx-check-box__input ref={mergedRef} onChange={handleChange} {...props} />
			<Box is='i' rcx-check-box__fake aria-hidden='true' />
		</Box>
	);
}

export default CheckBox;
