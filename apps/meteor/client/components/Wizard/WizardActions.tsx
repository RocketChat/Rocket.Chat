import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type WizardActionsProps = {
	children: ReactNode;
};

const WizardActions = ({ children }: WizardActionsProps) => {
	return (
		<Box is={ButtonGroup} mbs={24} display='flex' justifyContent='end'>
			{children}
		</Box>
	);
};

export default WizardActions;
