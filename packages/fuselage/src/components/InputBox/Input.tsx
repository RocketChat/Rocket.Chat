import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type InputProps<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = Omit<BoxProps, 'ref'> & RefAttributes<T>;

function Input<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(props: InputProps<T>) {
	return <Box is='input' animated rcx-input-box {...props} />;
}

export default Input;
