import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

type SelectFocusProps = Omit<BoxProps, 'ref'> & RefAttributes<Element>;

function SelectFocus(props: SelectFocusProps) {
	return <Box fontScale='p2m' color='hint' rcx-select__focus is='button' type='button' {...props} />;
}

export default SelectFocus;
