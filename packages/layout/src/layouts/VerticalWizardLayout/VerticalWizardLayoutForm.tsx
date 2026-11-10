import { Box, Tile } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const VerticalWizardLayoutForm = ({ children }: { children: ReactNode }) => (
	<Box width='full'>
		<Tile flush>{children}</Tile>
	</Box>
);

export default VerticalWizardLayoutForm;
