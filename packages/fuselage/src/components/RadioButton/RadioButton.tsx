import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode, RefAttributes } from 'react';

import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, size } from '../../styleTokens';
import type { BoxProps } from '../Box';
import {
	createSelectionButtonFake,
	hasDisabledClassName,
	SelectionButtonInput,
	SelectionButtonLabel,
} from '../CheckBox/SelectionButtonFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const RadioButtonFake = styled(createSelectionButtonFake('empty'), {
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	borderRadius: toCSSValue('--rcx-border-radius-full', borderRadius('full')),
	width: size('x20'),
});

// Hidden until the stylesheet reveals it for `:checked`
const RadioButtonDot = styled(View, {
	render: 'span',
	display: 'block',
	visibility: 'hidden',
	width: '0.375rem',
	height: '0.375rem',
	borderRadius: toCSSValue('--rcx-border-radius-full', borderRadius('full')),
	backgroundColor: 'currentColor',
});

export type RadioButtonProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLInputElement> &
	AllHTMLAttributes<HTMLInputElement> & {
		labelChildren?: ReactNode;
	};

function RadioButton({ className, labelChildren, ...props }: RadioButtonProps) {
	const labelProps = useTamaguiBoxProps({ className }, 'rcx-radio-button');
	const inputProps = useTamaguiBoxProps(props, 'rcx-radio-button__input');

	return (
		<SelectionButtonLabel notAllowed={hasDisabledClassName(labelProps.className)} {...labelProps}>
			{labelChildren}
			<SelectionButtonInput {...({ type: 'radio', ...inputProps } as GetProps<typeof SelectionButtonInput>)} />
			<RadioButtonFake className='rcx-radio-button__fake' aria-hidden>
				<RadioButtonDot />
			</RadioButtonFake>
		</SelectionButtonLabel>
	);
}

export default withFuselageProvider(RadioButton, { takesBoxTransforms: true });
