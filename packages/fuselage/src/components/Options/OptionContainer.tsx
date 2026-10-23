import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';
import { PopoverSurface } from '../PopoverSurface';
import { Scrollable } from '../Scrollable';

export type OptionContainerProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLElement>;

function OptionContainer(props: OptionContainerProps) {
	return (
		<Box rcx-options>
			<PopoverSurface elevation='1'>
				<Scrollable vertical smooth>
					<Box borderRadius='medium' backgroundColor='light' maxHeight='x240' {...props} />
				</Scrollable>
			</PopoverSurface>
		</Box>
	);
}

export default OptionContainer;
