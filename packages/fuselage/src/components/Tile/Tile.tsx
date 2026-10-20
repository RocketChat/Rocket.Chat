import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type TileProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLElement>;

function Tile({ elevation = '1', padding = 16, ...props }: TileProps) {
	return <Box rcx-tile rcx-tile--elevation={elevation} padding={padding} {...props} />;
}

export default Tile;
