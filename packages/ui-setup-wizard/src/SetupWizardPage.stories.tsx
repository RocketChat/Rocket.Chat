import { extractTranslationNamespaces } from '@rocket.chat/i18n';
import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { userEvent, within } from 'storybook/test';

import SetupWizardPage from './SetupWizardPage';
import { SetupWizardContext } from './contexts/SetupWizardContext';
import type { OrganizationOptions } from './hooks/useOrganizationOptions';

type SetupWizardContextValue = ComponentProps<typeof SetupWizardContext.Provider>['value'];

const translations = extractTranslationNamespaces(en);

const organizationOptions: OrganizationOptions = {
	industry: [
		['aerospaceDefense', 'Aerospace and Defense'],
		['consulting', 'Consulting'],
		['consumerGoods', 'Consumer Packaged Goods'],
	],
	size: [
		['0', '1-10 people'],
		['1', '11-50 people'],
		['2', '51-100 people'],
	],
	country: [
		['afghanistan', 'Afghanistan'],
		['albania', 'Albania'],
		['algeria', 'Algeria'],
	],
};

const createContextValue = (overrides: Partial<SetupWizardContextValue> = {}): SetupWizardContextValue => ({
	setupWizardData: {
		organizationData: {
			organizationName: '',
			organizationIndustry: '',
			organizationSize: '',
			country: '',
		},
		serverData: {
			agreement: false,
			email: '',
			updates: false,
		},
		registrationData: { cloudEmail: '', user_code: '', device_code: '' },
	},
	setSetupWizardData: () => undefined,
	loaded: true,
	organizationOptions,
	currentStep: 1,
	validateEmail: () => true,
	validateUsername: () => true,
	validatePassword: () => true,
	passwordRulesHint: '',
	canGoToPreviousStep: true,
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
	...overrides,
});

const createAppRoot = ({ offline }: { offline: boolean }) =>
	mockAppRoot()
		.withTranslations('en', 'core', translations.core)
		.withTranslations('en', 'onboarding', translations.onboarding)
		.withJohnDoe()
		.withRole('admin')
		.withEndpoint('POST', '/v1/cloud.registerPreIntent', () => ({ offline }))
		.withEndpoint('GET', '/v1/cloud.workspaceRegisterData', () => ({ registerData: 'eyJ3b3Jrc3BhY2VJZCI6ImRlbW8ifQ==' }))
		.withEndpoint('GET', '/v1/cloud.confirmationPoll', () => ({ pollData: { status: 'authorization_pending' as const } }))
		.build();

const OnlineAppRoot = createAppRoot({ offline: false });
const OfflineAppRoot = createAppRoot({ offline: true });

const meta = {
	component: SetupWizardPage,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story, { parameters }) => {
			const AppRoot = parameters.offline ? OfflineAppRoot : OnlineAppRoot;

			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
	render: (_args, { parameters }) => (
		<SetupWizardContext.Provider value={createContextValue(parameters.setupWizard)}>
			<SetupWizardPage />
		</SetupWizardContext.Provider>
	),
} satisfies Meta<typeof SetupWizardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AdminInfo: Story = {
	parameters: { setupWizard: { currentStep: 1 } },
};

export const OrganizationInfo: Story = {
	parameters: { setupWizard: { currentStep: 2 } },
};

// A workspace that is already registered skips the cloud steps, so organization info is the last step.
export const OrganizationInfoAlreadyRegistered: Story = {
	parameters: { setupWizard: { currentStep: 2, maxSteps: 2, skipCloudRegistration: true } },
};

export const RegisterServer: Story = {
	parameters: { setupWizard: { currentStep: 3 } },
};

// Registering offline is only offered when the server cannot reach the cloud.
export const RegisterServerWithoutInternet: Story = {
	parameters: { setupWizard: { currentStep: 3 }, offline: true },
};

export const RegisterOffline: Story = {
	...RegisterServerWithoutInternet,
	play: async ({ canvasElement }) => {
		await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Register offline' }));
	},
};

export const AwaitingConfirmation: Story = {
	parameters: {
		setupWizard: {
			currentStep: 4,
			setupWizardData: {
				...createContextValue().setupWizardData,
				registrationData: {
					cloudEmail: 'admin@example.com',
					user_code: 'Purple-Dog-Mountain',
					device_code: 'device-code',
					interval: 5,
				},
			},
		},
	},
};
