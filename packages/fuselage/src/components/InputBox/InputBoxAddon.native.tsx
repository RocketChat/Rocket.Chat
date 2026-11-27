import type { InputBoxAddonProps } from './InputBoxAddon';
import { Box } from '../Box';

/** The native twin of `InputBoxAddon`: a row that keeps its size beside the input. */
function InputBoxAddon(props: InputBoxAddonProps) {
	return <Box rcx-input-box__addon flexDirection='row' alignItems='flex-start' flexGrow={0} flexShrink={0} {...props} />;
}

export default InputBoxAddon;
