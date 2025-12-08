import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type InfoPanelProps = {
	children?: ReactNode;
};

const InfoPanel = ({ children }: InfoPanelProps) => (
	<Box flexGrow={1} mb='neg-x24'>
		{children}
	</Box>
);

export default InfoPanel;
