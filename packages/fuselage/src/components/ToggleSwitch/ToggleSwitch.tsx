import type { InputHTMLAttributes, ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ToggleSwitchProps = ElementProps<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>> & {
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
