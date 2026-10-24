import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { styled, View, type GetProps } from '@tamagui/web';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useLayoutEffect, useRef, useCallback } from 'react';

import { createSelectionButtonFake, hasDisabledClassName, SelectionButtonInput, SelectionButtonLabel } from './SelectionButtonFrames';
import { cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, size } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const CheckBoxFake = styled(createSelectionButtonFake('empty'), {
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	borderRadius: toCSSValue('--rcx-check-box-border-radius', toCSSValue('--rcx-border-radius-small', borderRadius('small'))),
	width: size('x20'),
});

// Moves the strokes from the box center to where the check mark sits
const checkOffset = 'translate(-0.25rem, 0.125rem) rotate(-45deg)';

// Hidden until the stylesheet reveals it for `:checked` or `:indeterminate`
const CheckBoxMark = styled(View, {
	render: 'span',
	position: 'absolute',
	display: 'block',
	visibility: 'hidden',
	opacity: 0,
	backgroundColor: 'currentColor',
	borderRadius: '0.0625rem',
	width: '0.75rem',
	height: '0.125rem',

	variants: {
		stroke: {
			long: { transform: `${checkOffset} translate(0.375rem, 0.125rem)` },
			short: { width: '0.125rem', height: '0.375rem', transform: checkOffset },
		},
	} as const,
});

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
		<SelectionButtonLabel notAllowed={hasDisabledClassName(className)} className={cx('rcx-check-box', className)}>
			{labelChildren}
			<SelectionButtonInput
				{...({ type: 'checkbox', ref: mergedRef, onChange: handleChange, ...props } as GetProps<typeof SelectionButtonInput>)}
				className='rcx-check-box__input'
			/>
			<CheckBoxFake className='rcx-check-box__fake' aria-hidden>
				<CheckBoxMark />
				<CheckBoxMark stroke='long' />
				<CheckBoxMark stroke='short' />
			</CheckBoxFake>
		</SelectionButtonLabel>
	);
}

export default withFuselageProvider(CheckBox);
