import { createContext, useContext } from 'react';

export type StepsWizardStep = {
	id: string;
	title: string;
	onNext?(): Promise<void> | void;
	onBack?(): Promise<void> | void;
	validate?: () => boolean | Promise<boolean>;
};

type StepsWizardContextType = {
	registerStep: (step: StepsWizardStep) => void;
	currentStep: string | null;
};

export const StepsWizardContext = createContext<StepsWizardContextType | null>(null);

export const useStepsWizardContext = () => {
	const context = useContext(StepsWizardContext);

	if (!context) {
		throw new Error('useStepsWizardContext must be used within a StepsWizardProvider');
	}

	return context;
};
