import { Box, Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type TileStatusProps = { avatar: ReactNode; children: ReactNode };

/** A tile's avatar with a line under it saying what the tile is waiting for. */
const TileStatus = ({ avatar, children }: TileStatusProps) => (
	<Box position='relative'>
		<Stack gap={8} align='center'>
			{avatar}
			<Box
				role='status'
				display='flex'
				alignItems='center'
				gap={8}
				fontScale='c1'
				paddingInline={8}
				paddingBlock={2}
				borderRadius='small'
				backgroundColor='overlay'
				color='pure-white'
			>
				{children}
			</Box>
		</Stack>
	</Box>
);

export default TileStatus;
