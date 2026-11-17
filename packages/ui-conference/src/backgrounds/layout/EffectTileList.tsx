import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const EffectTileList = ({ children }: { children: ReactNode }) => (
	<Box display='flex' flexDirection='column' style={{ gap: '1.25rem' }}>
		{children}
	</Box>
);

export default EffectTileList;
