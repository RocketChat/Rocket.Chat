import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type TileProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLElement> & {
		/** Drops the default padding, for a surface whose content brings its own. */
		flush?: boolean;
	};

function Tile({ elevation = '1', flush, padding = flush ? undefined : 16, ...props }: TileProps) {
	return <Box rcx-tile rcx-tile--elevation={elevation} padding={padding} {...props} />;
}

export default Tile;
