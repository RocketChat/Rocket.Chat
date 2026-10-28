import { Box, Tile } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type NoDataTileProps = {
	children: ReactNode;
};

/**
 * Stands in for a table that has no rows to show, with a short centred message.
 */
const NoDataTile = ({ children }: NoDataTileProps) => (
	<Tile>
		<Box fontScale='p1' color='hint' textAlign='center'>
			{children}
		</Box>
	</Tile>
);

export default NoDataTile;
