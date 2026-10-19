import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

type AddonProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLDivElement>;

function SelectAddon(props: AddonProps) {
	return <Box is='div' rcx-select__addon {...props} />;
}

export default SelectAddon;
