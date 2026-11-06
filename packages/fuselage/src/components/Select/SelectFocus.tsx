import type { ButtonHTMLAttributes, RefAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

type SelectFocusProps = Omit<ElementProps<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>, 'ref'> & RefAttributes<Element>;

function SelectFocus(props: SelectFocusProps) {
	return <Box rcx-select__focus rcx-select__focus--button is='button' type='button' {...props} />;
}

export default SelectFocus;
