import React, { useCallback, useMemo, useState, ReactElement } from 'react';

import SetupWizardPage from '../SetupWizardPage';
import { SetupWizardContext } from '../contexts/SetupWizardContext';
import { useParameters } from '../hooks/useParameters';
import { useStepRouting, FINAL_STEP } from '../hooks/useStepRouting';

const SetupWizardProvider = (): ReactElement => {
	const [setupWizardData, setSetupWizardData] = useState({ adminData: {} });
	const [currentStep, setCurrentStep] = useStepRouting();
	const { loaded, settings, canDeclineServerRegistration } = useParameters();

	const goToPreviousStep = useCallback(
		() => setCurrentStep((currentStep) => currentStep - 1),
		[setCurrentStep],
	);

	const goToNextStep = useCallback(
		() => setCurrentStep((currentStep) => currentStep + 1),
		[setCurrentStep],
	);

	const goToFinalStep = useCallback(() => setCurrentStep(FINAL_STEP), [setCurrentStep]);

	const value = useMemo(
		() => ({
			setupWizardData,
			setSetupWizardData,
			currentStep,
			loaded,
			settings,
			canDeclineServerRegistration,
			goToPreviousStep,
			goToNextStep,
			goToFinalStep,
		}),
		[
			setupWizardData,
			setSetupWizardData,
			currentStep,
			loaded,
			settings,
			canDeclineServerRegistration,
			goToPreviousStep,
			goToNextStep,
			goToFinalStep,
		],
	);

	return (
		<SetupWizardContext.Provider value={value}>
			<SetupWizardPage currentStep={currentStep} />
		</SetupWizardContext.Provider>
	);
};

export default SetupWizardProvider;
