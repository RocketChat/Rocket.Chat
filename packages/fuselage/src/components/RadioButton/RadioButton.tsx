import { styled, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode, RefAttributes } from 'react';

import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, size } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { SelectionButtonFake, SelectionButtonInput, SelectionButtonLabel } from '../CheckBox/SelectionButtonFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const RadioButtonFake = styled(SelectionButtonFake, {
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	borderRadius: toCSSValue('--rcx-border-radius-full', borderRadius('full')!),
	width: size('x20'),
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
		<SelectionButtonLabel {...labelProps}>
			{labelChildren}
			<SelectionButtonInput {...({ type: 'radio', ...inputProps } as GetProps<typeof SelectionButtonInput>)} />
			<RadioButtonFake className='rcx-radio-button__fake' aria-hidden />
		</SelectionButtonLabel>
	);
}

export default withFuselageProvider(RadioButton, { takesBoxTransforms: true });
