import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type OutboundMessageWizardStepsProps = {
	children: ReactNode;
};

/**
 * The area below the wizard's tabs that the current step fills.
 */
const OutboundMessageWizardSteps = ({ children }: OutboundMessageWizardStepsProps) => (
	<Box marginBlockStart='x16' minHeight={0} flexGrow={1}>
		{children}
	</Box>
);

export default OutboundMessageWizardSteps;
