import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type WizardActionsProps = {
	annotation?: string;
	children: ReactNode;
};

const WizardActions = ({ annotation, children }: WizardActionsProps) => (
	<Box className='steps-wizard-footer' pbs={24} display='flex' alignItems='center' justifyContent='end'>
		{annotation ? (
			<Box mie='auto' fontScale='c1' color='annotation'>
				{annotation}
			</Box>
		) : null}

		<ButtonGroup>{children}</ButtonGroup>
	</Box>
);

export default WizardActions;
