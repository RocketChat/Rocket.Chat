import { Box } from '@rocket.chat/fuselage';
import type { ContextType, ReactNode } from 'react';

import { SurfaceContext } from '../contexts/SurfaceContext';

export type SurfaceProps = {
	children: ReactNode;
	type: ContextType<typeof SurfaceContext>;
};

export const Surface = ({ children, type }: SurfaceProps) => (
	<SurfaceContext.Provider value={type}>
		<Box display='flex' flexDirection='column' gap={16} paddingBlockEnd={type === 'message' ? 16 : undefined}>
			{children}
		</Box>
	</SurfaceContext.Provider>
);
