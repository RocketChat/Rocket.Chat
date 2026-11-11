import type { InputHTMLAttributes, ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type RadioButtonProps = ElementProps<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>> & {
	labelChildren?: ReactNode;
};

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
