import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type InputBoxAddonProps = ElementProps<HTMLSpanElement>;

/**
 * An addon for the input box.
 */
function InputBoxAddon(props: InputBoxAddonProps) {
	return <Box is='span' rcx-input-box__addon {...props} />;
}

export default InputBoxAddon;
