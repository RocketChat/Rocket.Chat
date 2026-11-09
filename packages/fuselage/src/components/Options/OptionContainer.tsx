import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';
import { PopoverSurface } from '../PopoverSurface/index.js';
import { Scrollable } from '../Scrollable/index.js';

export type OptionContainerProps = ElementProps<HTMLElement>;

function OptionContainer(props: OptionContainerProps) {
	return (
		<Box rcx-options>
			<PopoverSurface elevation='1'>
				<Scrollable vertical smooth>
					<Box rcx-options__list rcx-options__list--container {...props} />
				</Scrollable>
			</PopoverSurface>
		</Box>
	);
}

export default OptionContainer;
