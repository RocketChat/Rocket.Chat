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

	return <div>{children}</div>;
};

export default memo(WizardContent);
