import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';
import { Scrollable } from '../Scrollable';

export type OptionContainerProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLElement>;

function OptionContainer(props: OptionContainerProps) {
	return (
		<Box rcx-options>
			<Box rcx-tile rcx-tile--elevation='1' paddingBlock='x12'>
				<Scrollable vertical smooth>
					<Box rcx-tile rcx-tile--elevation='0' maxHeight='x240' {...props} />
				</Scrollable>
			</Box>
		</Box>
	);
}

export default OptionContainer;
