import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

type AddonProps = ElementProps<HTMLDivElement>;

function SelectAddon(props: AddonProps) {
	return <Box is='div' rcx-select__addon {...props} />;
}

export default SelectAddon;
