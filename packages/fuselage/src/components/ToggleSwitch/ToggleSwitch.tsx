import type { AllHTMLAttributes, ReactNode, RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type ToggleSwitchProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLInputElement> &
	AllHTMLAttributes<HTMLInputElement> & {
		labelChildren?: ReactNode;
	};

function ToggleSwitch({ className, labelChildren, ...props }: ToggleSwitchProps) {
	return (
		<Box is='label' className={className} rcx-toggle-switch>
			{labelChildren}

			<Box is='input' rcx-toggle-switch__input type='checkbox' {...props} />
			<Box is='i' rcx-toggle-switch__fake aria-hidden='true' />
		</Box>
	);
}

export default ToggleSwitch;
