import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ContextType } from 'react';

import OrganizationInfoStep from './OrganizationInfoStep';
import { SetupWizardContext } from '../contexts/SetupWizardContext';

type SetupWizardContextValue = ContextType<typeof SetupWizardContext>;

const organizationData = {
	organizationName: 'Acme',
	organizationIndustry: 'consulting',
	organizationSize: '0',
	country: 'brazil',
};

const renderStep = (overrides: Partial<SetupWizardContextValue>) => {
	const defaultValue: SetupWizardContextValue = {
		setupWizardData: {
			organizationData,
			serverData: { agreement: false, email: '', updates: false },
			registrationData: { cloudEmail: '', user_code: '', device_code: '' },
		},
		setSetupWizardData: () => undefined,
		loaded: true,
		organizationOptions: {
			industry: [['consulting', 'Consulting']],
			size: [['0', '1-10 people']],
			country: [['brazil', 'Brazil']],
		},
		currentStep: 2,
		validateEmail: () => true,
		validateUsername: () => true,
		validatePassword: () => true,
		passwordRulesHint: '',
		canGoToPreviousStep: false,
		skipCloudRegistration: false,
		goToPreviousStep: () => undefined,
		goToNextStep: () => undefined,
		goToStep: () => undefined,
		registerAdminUser: async () => undefined,
		registerServer: async () => undefined,
		saveAgreementData: async () => undefined,
		saveWorkspaceData: async () => undefined,
		saveOrganizationData: async () => undefined,
		completeSetupWizard: async () => undefined,
		maxSteps: 4,
	};

	render(
		<SetupWizardContext.Provider value={{ ...defaultValue, ...overrides }}>
			<OrganizationInfoStep />
		</SetupWizardContext.Provider>,
		{ wrapper: mockAppRoot().build() },
	);
};

it('saves the organization info before going to the next step', async () => {
	const saveOrganizationData = jest.fn(async () => undefined);
	const goToNextStep = jest.fn();

	renderStep({ saveOrganizationData, goToNextStep });

	fireEvent.submit(screen.getByRole('form'));

	await waitFor(() => expect(goToNextStep).toHaveBeenCalled());
	expect(saveOrganizationData).toHaveBeenCalledWith(organizationData);
});

it('saves the organization info when the workspace is already registered', async () => {
	const saveOrganizationData = jest.fn(async () => undefined);
	const completeSetupWizard = jest.fn(async () => undefined);

	renderStep({ saveOrganizationData, completeSetupWizard, skipCloudRegistration: true, maxSteps: 2 });

	fireEvent.submit(screen.getByRole('form'));

	await waitFor(() => expect(completeSetupWizard).toHaveBeenCalled());
	expect(saveOrganizationData).toHaveBeenCalledWith(organizationData);
	expect(saveOrganizationData.mock.invocationCallOrder[0]).toBeLessThan(completeSetupWizard.mock.invocationCallOrder[0]);
});
