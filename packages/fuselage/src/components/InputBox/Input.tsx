import type { AllHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type InputProps<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = ElementProps<T, AllHTMLAttributes<T>> & {
	is?: 'input' | 'textarea' | 'select';
	htmlSize?: number;
	invisible?: boolean;
};

function Input<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(props: InputProps<T>) {
	return <Box is='input' animated rcx-input-box {...props} />;
}

export default Input;
