import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

type PaginatedSelectWrapperProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLDivElement>;

function PaginatedSelectWrapper(props: PaginatedSelectWrapperProps) {
	return <Box is='div' rcx-select__wrapper {...props} />;
}

export default PaginatedSelectWrapper;
