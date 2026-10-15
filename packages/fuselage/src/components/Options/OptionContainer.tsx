import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';
import { Scrollable } from '../Scrollable';
import { Tile } from '../Tile';

export type OptionContainerProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLElement>;

function OptionContainer(props: OptionContainerProps) {
	return (
		<Box rcx-options>
			<Tile padding={0} paddingBlock='x12' paddingInline={0}>
				<Scrollable vertical smooth>
					<Tile elevation='0' padding='none' maxHeight='x240' {...props} />
				</Scrollable>
			</Tile>
		</Box>
	);
}

export default OptionContainer;
