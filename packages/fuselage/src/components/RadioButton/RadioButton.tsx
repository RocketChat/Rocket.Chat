import { styled, View, type GetProps } from '@tamagui/web';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, size } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
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

export type RadioButtonProps = ElementProps<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>> & {
	labelChildren?: ReactNode;
};

function RadioButton({ className, labelChildren, ...props }: RadioButtonProps) {
	return (
		<SelectionButtonLabel notAllowed={hasDisabledClassName(className)} className={cx('rcx-radio-button', className)}>
			{labelChildren}
			<SelectionButtonInput
				{...({ type: 'radio', ...props } as GetProps<typeof SelectionButtonInput>)}
				className='rcx-radio-button__input'
			/>
			<RadioButtonFake className='rcx-radio-button__fake' aria-hidden>
				<RadioButtonDot />
			</RadioButtonFake>
		</SelectionButtonLabel>
	);
}

export default withFuselageProvider(RadioButton);
