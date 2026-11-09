import type { ButtonHTMLAttributes, RefAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

type SelectFocusProps = Omit<ElementProps<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>, 'ref'> & RefAttributes<Element>;

function SelectFocus(props: SelectFocusProps) {
	return <Box rcx-select__focus rcx-select__focus--button is='button' type='button' {...props} />;
}

export default SelectFocus;
