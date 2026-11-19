import type { InputHTMLAttributes, ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type RadioButtonProps = ElementProps<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>> & {
	/**
	 * Placed inside the control's own `label`, which names it. Use visually hidden text when the visible label is
	 * elsewhere.
	 */
	labelChildren?: ReactNode;
};

/**
 * Selects one option from a set of mutually exclusive ones.
 */
function RadioButton({ className, labelChildren, ...props }: RadioButtonProps) {
	return (
		<Box is='label' className={className} rcx-radio-button>
			{labelChildren}
			<Box is='input' rcx-radio-button__input type='radio' {...props} />
			<Box is='i' rcx-radio-button__fake aria-hidden='true' />
		</Box>
	);
}

export default RadioButton;
