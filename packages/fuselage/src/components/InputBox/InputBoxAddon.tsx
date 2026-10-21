import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type InputBoxAddonProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLSpanElement>;

/**
 * An addon for the input box.
 */
function InputBoxAddon(props: InputBoxAddonProps) {
	return <Box is='span' rcx-input-box__addon {...props} />;
}

export default InputBoxAddon;
