import buttonTokens from '@rocket.chat/fuselage-tokens/dist/button.json';
import { styled, View, type GetProps } from '@tamagui/web';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { toCSSColorValue, toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, size } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { createSelectionButtonFake, SelectionButtonInput, SelectionButtonLabel } from '../CheckBox/SelectionButtonFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const toggleSwitchRadius = toCSSValue('--rcx-toggle-switch-border-radius', toCSSValue('--rcx-border-radius-full', borderRadius('full')));
const onPrimary = toCSSColorValue('button-font-on-primary', buttonTokens.light.fontOnPrimary);

const ToggleSwitchFake = styled(createSelectionButtonFake('off'), {
	width: size('x36'),
	height: `calc(${size('x20')} - 2 * ${borderWidth('default')})`,
	borderRadius: toggleSwitchRadius,
});

// Slides to the end through the stylesheet's `:checked` rule
const ToggleSwitchKnob = styled(View, {
	render: 'span',
	position: 'absolute',
	top: '50%',
	insetInlineStart: '0.0625rem',
	width: `calc(1rem - 2 * ${borderWidth('default')})`,
	height: `calc(1rem - 2 * ${borderWidth('default')})`,
	transform: 'translateY(-50%)',
	borderRadius: toggleSwitchRadius,
	backgroundColor: onPrimary,

	variants: {
		dimmed: {
			true: { backgroundColor: toCSSColorValue('button-font-on-secondary-disabled', buttonTokens.light.fontOnSecondaryDisabled) },
		},
	} as const,
});

export type ToggleSwitchProps = ElementProps<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>> & {
	labelChildren?: ReactNode;
};

function ToggleSwitch({ className, labelChildren, ...props }: ToggleSwitchProps) {
	return (
		<SelectionButtonLabel className={cx('rcx-toggle-switch', className)}>
			{labelChildren}

			<SelectionButtonInput
				{...({ type: 'checkbox', ...props } as GetProps<typeof SelectionButtonInput>)}
				className='rcx-toggle-switch__input'
			/>
			<ToggleSwitchFake className='rcx-toggle-switch__fake' aria-hidden>
				<ToggleSwitchKnob dimmed={Boolean(props.disabled)} />
			</ToggleSwitchFake>
		</SelectionButtonLabel>
	);
}

export default withFuselageProvider(ToggleSwitch);
