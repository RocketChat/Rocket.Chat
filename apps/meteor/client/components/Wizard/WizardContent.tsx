import { Box } from '@rocket.chat/fuselage';
import { memo, type ReactNode } from 'react';

import { useWizardContext } from './useWizardContext';

type WizardContentProps = {
	id: string;
	children: ReactNode;
};

const WizardContent = ({ id, children }: WizardContentProps) => {
	const { currentStep } = useWizardContext();

	if (currentStep?.id !== id) {
		return null;
	}

	return <Box>{children}</Box>;
};

export default memo(WizardContent);
