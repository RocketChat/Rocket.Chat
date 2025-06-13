import { Box } from '@rocket.chat/fuselage';
import { useId, useLayoutEffect, type ReactNode } from 'react';

import { useStepsWizardContext } from './StepsWizardContext';

type StepsWizardContentProps = {
	title: string;
	children: ReactNode;
	validate?: () => boolean | Promise<boolean>;
	onNext?: () => void;
	onBack?: () => void;
};

const StepsWizardContent = ({ children, title, validate, onNext, onBack }: StepsWizardContentProps) => {
	const { currentStep, registerStep } = useStepsWizardContext();
	const id = useId();

	useLayoutEffect(() => {
		return registerStep({ id, title, onNext, onBack, validate });
	}, [id, onBack, onNext, registerStep, title, validate]);

	if (currentStep !== id) {
		return null;
	}

	return <Box paddingBlockStart={16}>{children}</Box>;
};

export default StepsWizardContent;
