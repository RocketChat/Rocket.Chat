import type { AllHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type InputProps<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = ElementProps<T, AllHTMLAttributes<T>> & {
	is?: 'input' | 'textarea' | 'select';
	htmlSize?: number;
	invisible?: boolean;
	/** Drops the border, background and padding of the box, for an input that sits inside another control. */
	undecorated?: boolean;
};

function Input<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>({ undecorated, ...props }: InputProps<T>) {
	return <Box is='input' animated rcx-input-box rcx-input-box--undecorated={undecorated} {...props} />;
}

export default Input;
