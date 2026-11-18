import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppearanceBodyProps = { children: ReactNode };

const AppearanceBody = ({ children }: AppearanceBodyProps) => (
	<Box flexGrow={1} overflowY='auto' paddingBlock='x16' paddingInline='x16' display='flex' flexDirection='column'>
		{children}
	</Box>
);

export default AppearanceBody;
