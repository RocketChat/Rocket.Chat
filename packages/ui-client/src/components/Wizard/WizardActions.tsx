import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type WizardActionsProps = {
	children: ReactNode;
};

const WizardActions = ({ children }: WizardActionsProps) => (
	<Box className='steps-wizard-footer' pbs={24} display='flex' justifyContent='end'>
		<ButtonGroup>{children}</ButtonGroup>
	</Box>
);

export default WizardActions;
