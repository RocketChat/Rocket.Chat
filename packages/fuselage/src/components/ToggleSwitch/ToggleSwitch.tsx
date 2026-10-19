import { styled, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode, RefAttributes } from 'react';

import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, borderWidth, size } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { SelectionButtonFake, SelectionButtonInput, SelectionButtonLabel } from '../CheckBox/SelectionButtonFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const ToggleSwitchFake = styled(SelectionButtonFake, {
	width: size('x36'),
	height: `calc(${size('x20')} - 2 * ${borderWidth('default')})`,
	borderRadius: toCSSValue('--rcx-toggle-switch-border-radius', toCSSValue('--rcx-border-radius-full', borderRadius('full')!)),
});

export type ToggleSwitchProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLInputElement> &
	AllHTMLAttributes<HTMLInputElement> & {
		labelChildren?: ReactNode;
	};

function ToggleSwitch({ className, labelChildren, ...props }: ToggleSwitchProps) {
	const labelProps = useTamaguiBoxProps({ className }, 'rcx-toggle-switch');
	const inputProps = useTamaguiBoxProps(props, 'rcx-toggle-switch__input');

	return (
		<SelectionButtonLabel {...labelProps}>
			{labelChildren}

			<SelectionButtonInput {...({ type: 'checkbox', ...inputProps } as GetProps<typeof SelectionButtonInput>)} />
			<ToggleSwitchFake className='rcx-toggle-switch__fake' aria-hidden />
		</SelectionButtonLabel>
	);
}

export default withFuselageProvider(ToggleSwitch);
