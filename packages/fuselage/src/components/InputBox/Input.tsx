import type { AllHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type InputProps<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = ElementProps<T, AllHTMLAttributes<T>> & {
	is?: 'input' | 'textarea' | 'select';
	/** The element's HTML `size` attribute, which `size` can't carry because it is a styling prop. */
	htmlSize?: number;
	/** Hides the input but keeps the space it takes in the layout. */
	invisible?: boolean;
};

/**
 * The input element of an `InputBox`, for components that build their own box around it.
 */
function Input<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(props: InputProps<T>) {
	return <Box is='input' animated rcx-input-box {...props} />;
}

export default Input;
