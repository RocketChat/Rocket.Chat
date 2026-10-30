import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type LocalSearchIndexStatusPanelProps = { children: ReactNode };

const LocalSearchIndexStatusPanel = ({ children }: LocalSearchIndexStatusPanelProps) => (
	<Box paddingInline='x16' paddingBlockStart='x12' display='flex' flexDirection='column' gap='x8'>
		{children}
	</Box>
);

export default LocalSearchIndexStatusPanel;
