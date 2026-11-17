import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const TileStatus = ({ avatar, children }: { avatar: ReactNode; children: ReactNode }) => (
	<Box position='relative' display='flex' flexDirection='column' alignItems='center' style={{ gap: '0.5rem' }}>
		{avatar}
		<Box
			role='status'
			display='flex'
			alignItems='center'
			fontScale='c1'
			paddingInline={8}
			paddingBlock={2}
			borderRadius='small'
			style={{ gap: '0.5rem', color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
		>
			{children}
		</Box>
	</Box>
);

export default TileStatus;
