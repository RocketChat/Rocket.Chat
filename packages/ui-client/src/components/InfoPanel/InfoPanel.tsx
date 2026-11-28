import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type InfoPanelProps = {
	children?: ReactNode;
};

const InfoPanel = ({ children }: InfoPanelProps) => (
	<Box flexGrow={1} marginBlockStart='neg-x24'>
		{children}
	</Box>
);

export default InfoPanel;
