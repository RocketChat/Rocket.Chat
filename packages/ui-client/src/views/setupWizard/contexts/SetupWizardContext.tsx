import type { ISetting } from '@rocket.chat/core-typings';
import type { AdminInfoPage, OrganizationInfoPage, RegisterServerPage } from '@rocket.chat/onboarding-ui';
import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import { createContext, useContext } from 'react';

type SetupWizardData = {
	organizationData: Parameters<ComponentProps<typeof OrganizationInfoPage>['onSubmit']>[0];
	serverData: Parameters<ComponentProps<typeof RegisterServerPage>['onSubmit']>[0];
	registrationData: {
		device_code: string;
		user_code: string;
		cloudEmail: string;
		verification_url?: string;
		interval?: number;
		expires_in?: number;
	};
};

type SetupWizarContextValue = {
	setupWizardData: SetupWizardData;
	setSetupWizardData: Dispatch<SetStateAction<SetupWizardData>>;
	loaded: boolean;
	settings: Array<ISetting>;
	currentStep: number;
	validateEmail: (email: string) => string | true;
	skipCloudRegistration: boolean;
	goToPreviousStep: () => void;
	goToNextStep: () => void;
	goToStep: (step: number) => void;
	registerAdminUser: (user: Omit<Parameters<ComponentProps<typeof AdminInfoPage>['onSubmit']>[0], 'keepPosted'>) => Promise<void>;
	registerServer: (params: { email: string; resend?: boolean }) => Promise<void>;
	saveAgreementData: (agreement: boolean) => Promise<void>;
	saveWorkspaceData: () => Promise<void>;
	saveOrganizationData: (data: SetupWizardData['organizationData']) => Promise<void>;
	completeSetupWizard: () => Promise<void>;
	maxSteps: number;
};

export const SetupWizardContext = createContext<SetupWizarContextValue>({
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
	setSetupWizardData: (data) => data,
	loaded: false,
	settings: [],
	skipCloudRegistration: false,
	goToPreviousStep: () => undefined,
	goToNextStep: () => undefined,
	goToStep: () => undefined,
	registerAdminUser: async () => undefined,
	registerServer: async () => undefined,
	saveAgreementData: async () => undefined,
	saveWorkspaceData: async () => undefined,
	saveOrganizationData: async () => undefined,
	validateEmail: () => true,
	currentStep: 1,
	completeSetupWizard: async () => undefined,
	maxSteps: 4,
});

export const useSetupWizardContext = (): SetupWizarContextValue => useContext(SetupWizardContext);
