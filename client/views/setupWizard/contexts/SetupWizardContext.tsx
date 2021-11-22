import type {
	AdminInfoPage,
	// RegisterServerPage,
	OrganizationInfoPage,
} from '@rocket.chat/onboarding-ui';
import { ComponentProps, createContext, useContext, Dispatch, SetStateAction } from 'react';

import { ISetting } from '../../../../definition/ISetting';

// type WizardSettingValues = {
// 	values: Array<{
// 		i18nLabel: any;
// 		key: string;
// 	}>;
// } & ISetting;

// type WizardSettings =
// 	| [
// 			{ _id: 'Country' } & WizardSettingValues,
// 			{ _id: 'Organization_Type' } & WizardSettingValues,
// 			{ _id: 'Industry' } & WizardSettingValues,
// 			{ _id: 'Size' } & WizardSettingValues,
// 	  ]
// 	| [];

type SetupWizardData = {
	adminData: Omit<Parameters<ComponentProps<typeof AdminInfoPage>['onSubmit']>[0], 'keepPosted'>;
	organizationData: ComponentProps<typeof OrganizationInfoPage>['initialValues'];
	registrationData: {
		cloudEmail: string;
		user_code: string;
		device_code: string;
	};
};

type SetupWizarContextValue = {
	setupWizardData: SetupWizardData;
	setSetupWizardData: Dispatch<SetStateAction<SetupWizardData>>;
	loaded: boolean;
	// TODO FIX THIS TYPE
	// TODO FIX THIS TYPE
	// TODO FIX THIS TYPE
	// TODO FIX THIS TYPE
	settings: ISetting[];
	currentStep: number;
	validateEmail: (email: string) => string | true;
	canDeclineServerRegistration: boolean;
	goToPreviousStep: () => void;
	goToNextStep: () => void;
	registerAdminUser: () => Promise<void>;
	registerServer: (params: { email: string; resend?: boolean }) => Promise<void>;
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
		// eslint-disable-next-line @typescript-eslint/camelcase
		registrationData: { cloudEmail: '', user_code: '', device_code: '' },
	},
	setSetupWizardData: (data: {}) => data,
	loaded: false,
	settings: [],
	canDeclineServerRegistration: false,
	goToPreviousStep: () => undefined,
	goToNextStep: () => undefined,
	registerAdminUser: async () => undefined,
	registerServer: async () => undefined,
	validateEmail: () => true,
	currentStep: 1,
});

export const useSetupWizardContext = (): SetupWizarContextValue => useContext(SetupWizardContext);
