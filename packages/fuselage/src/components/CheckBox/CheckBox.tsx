import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useLayoutEffect, useRef, useCallback } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type CheckBoxProps = ElementProps<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>> & {
	indeterminate?: boolean;
	labelChildren?: ReactNode;
};

function CheckBox({ ref, indeterminate, onChange, className, labelChildren, ...props }: CheckBoxProps) {
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

	return (
		<Box is='label' className={className} rcx-check-box>
			{labelChildren}
			<Box is='input' type='checkbox' rcx-check-box__input ref={mergedRef} onChange={handleChange} {...props} />
			<Box is='i' rcx-check-box__fake aria-hidden='true' />
		</Box>
	);
}

export default CheckBox;
