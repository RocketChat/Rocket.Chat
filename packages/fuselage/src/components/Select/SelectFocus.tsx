import type { ButtonHTMLAttributes, RefAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

type SelectFocusProps = Omit<ElementProps<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>, 'ref'> & RefAttributes<Element>;

function SelectFocus(props: SelectFocusProps) {
	return <Box fontScale='p2m' color='hint' rcx-select__focus is='button' type='button' {...props} />;
}

export default SelectFocus;
