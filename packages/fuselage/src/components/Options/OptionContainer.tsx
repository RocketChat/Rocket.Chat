import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';
import { Scrollable } from '../Scrollable';
import { Tile } from '../Tile';

export type OptionContainerProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLElement>;

function OptionContainer(props: OptionContainerProps) {
	return (
		<Box rcx-options>
			<Tile flush paddingBlock='x12'>
				<Scrollable vertical smooth>
					<Tile flush elevation='0' maxHeight='x240' {...props} />
				</Scrollable>
			</Tile>
		</Box>
	);
}

export default OptionContainer;
