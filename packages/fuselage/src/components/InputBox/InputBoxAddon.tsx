import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type InputBoxAddonProps = ElementProps<HTMLSpanElement>;

/**
 * An addon for the input box.
 */
function InputBoxAddon(props: InputBoxAddonProps) {
	return <Box is='span' rcx-input-box__addon {...props} />;
}

export default InputBoxAddon;
