import React from 'react';

import SetupWizardPage from './SetupWizardPage';
import { finalStep } from './SetupWizardState';

export default {
	title: 'views/setupWizard/SetupWizardPage',
	component: SetupWizardPage,
};

export const atStep1 = () => <SetupWizardPage currentStep={1} />;

export const atStep2 = () => <SetupWizardPage currentStep={2} />;

export const atStep3 = () => <SetupWizardPage currentStep={3} />;

export const atStep4 = () => <SetupWizardPage currentStep={4} />;

export const atFinalStep = () => <SetupWizardPage currentStep={finalStep} />;
