import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

type AddonProps = ElementProps<HTMLDivElement>;

function SelectAddon(props: AddonProps) {
	return <Box is='div' rcx-select__addon {...props} />;
}

export default SelectAddon;
