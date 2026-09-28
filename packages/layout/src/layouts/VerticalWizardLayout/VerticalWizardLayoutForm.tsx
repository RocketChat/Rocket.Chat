import { Tile } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const VerticalWizardLayoutForm = ({ children }: { children: ReactNode }) => (
	<Tile padding={0} width='100%'>
		{children}
	</Tile>
);

export default VerticalWizardLayoutForm;
