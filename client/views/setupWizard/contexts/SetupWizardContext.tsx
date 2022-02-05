import type { AdminInfoPage, OrganizationInfoPage, RegisteredServerPage } from '@rocket.chat/onboarding-ui';
import { ComponentProps, createContext, useContext, Dispatch, SetStateAction } from 'react';

import { ISetting } from '../../../../definition/ISetting';

type SetupWizardData = {
	adminData: Omit<Parameters<ComponentProps<typeof AdminInfoPage>['onSubmit']>[0], 'keepPosted'>;
	organizationData: Parameters<ComponentProps<typeof OrganizationInfoPage>['onSubmit']>[0];
	serverData: Parameters<ComponentProps<typeof RegisteredServerPage>['onSubmit']>[0];
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
	registerAdminUser: () => Promise<void>;
	registerServer: (params: { email: string; resend?: boolean }) => Promise<void>;
	saveWorkspaceData: () => Promise<void>;
	saveOrganizationData: () => Promise<void>;
	completeSetupWizard: () => Promise<void>;
	maxSteps: number;
};

export const SetupWizardContext = createContext<SetupWizarContextValue>({
	setupWizardData: {
		adminData: { fullname: '', username: '', companyEmail: '', password: '' },
		organizationData: {
			organizationName: '',
			organizationType: '',
			organizationIndustry: '',
			organizationSize: '',
			country: '',
		},
		serverData: {
			agreement: false,
			email: '',
			registerType: 'registered',
			updates: false,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		registrationData: { cloudEmail: '', user_code: '', device_code: '' },
	},
	setSetupWizardData: (data: {}) => data,
	loaded: false,
	settings: [],
	skipCloudRegistration: false,
	goToPreviousStep: () => undefined,
	goToNextStep: () => undefined,
	goToStep: () => undefined,
	registerAdminUser: async () => undefined,
	registerServer: async () => undefined,
	saveWorkspaceData: async () => undefined,
	saveOrganizationData: async () => undefined,
	validateEmail: () => true,
	currentStep: 1,
	completeSetupWizard: async () => undefined,
	maxSteps: 4,
});

export const useSetupWizardContext = (): SetupWizarContextValue => useContext(SetupWizardContext);
