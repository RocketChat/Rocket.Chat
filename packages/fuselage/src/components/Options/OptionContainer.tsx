import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { PopoverSurface } from '../PopoverSurface';

export type OptionContainerProps = ElementProps<HTMLElement>;

function OptionContainer(props: OptionContainerProps) {
	return (
		<Box rcx-options>
			<PopoverSurface elevation='1'>
				<Box rcx-options__list rcx-options__list--container {...props} />
			</PopoverSurface>
		</Box>
	);
}

export default OptionContainer;
