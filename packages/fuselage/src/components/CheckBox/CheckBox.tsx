import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { styled, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ChangeEvent, ReactNode, RefAttributes } from 'react';
import { useLayoutEffect, useRef, useCallback } from 'react';

import { SelectionButtonFake, SelectionButtonInput, SelectionButtonLabel } from './SelectionButtonFrames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, size } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const CheckBoxFake = styled(SelectionButtonFake, {
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	borderRadius: toCSSValue('--rcx-check-box-border-radius', toCSSValue('--rcx-border-radius-small', borderRadius('small')!)),
	width: size('x20'),
});

export type CheckBoxProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLInputElement> & {
		indeterminate?: boolean;
		labelChildren?: ReactNode;
	} & AllHTMLAttributes<HTMLInputElement>;

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

	const labelProps = useTamaguiBoxProps({ className }, 'rcx-check-box');
	const inputProps = useTamaguiBoxProps(props, 'rcx-check-box__input');

	return (
		<SelectionButtonLabel {...labelProps}>
			{labelChildren}
			<SelectionButtonInput
				{...({ type: 'checkbox', ref: mergedRef, onChange: handleChange, ...inputProps } as GetProps<typeof SelectionButtonInput>)}
			/>
			<CheckBoxFake className='rcx-check-box__fake' aria-hidden />
		</SelectionButtonLabel>
	);
}

export default withFuselageProvider(CheckBox);
