import type { AllHTMLAttributes, ReactNode, RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type RadioButtonProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLInputElement> &
	AllHTMLAttributes<HTMLInputElement> & {
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
