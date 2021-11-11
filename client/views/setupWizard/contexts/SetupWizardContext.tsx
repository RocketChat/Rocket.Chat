import {
	AdminInfoPage,
	RegisterServerPage,
	OrganizationInfoPage,
} from '@rocket.chat/onboarding-ui';
import { ComponentProps, createContext, useContext, Dispatch, SetStateAction } from 'react';

type SetupWizardData = {
	adminData: ComponentProps<typeof AdminInfoPage>['initialValues'];
	organizationData: ComponentProps<typeof OrganizationInfoPage>['initialValues'];
	registrationData: ComponentProps<typeof RegisterServerPage>['initialValues'];
};

type SetupWizarContextValue = {
	setupWizardData: SetupWizardData;
	setSetupWizardData: Dispatch<SetStateAction<SetupWizardData>>;
	loaded: boolean;
	// TODO FIX THIS TYPE
	// TODO FIX THIS TYPE
	// TODO FIX THIS TYPE
	// TODO FIX THIS TYPE
	settings: Array<string>;
	canDeclineServerRegistration: boolean;
	goToPreviousStep: () => void;
	goToNextStep: () => void;
	goToFinalStep: () => void;
};

export const SetupWizardContext = createContext<SetupWizarContextValue>({
	setupWizardData: {
		adminData: { fullname: '', username: '', companyEmail: '', keepPosted: false },
		organizationData: {
			organizationName: '',
			organizationType: '',
			organizationIndustry: '',
			organizationSize: '',
			country: '',
		},
		registrationData: {},
	},
	setSetupWizardData: (data: {}) => data,
	loaded: false,
	settings: [],
	canDeclineServerRegistration: false,
	goToPreviousStep: () => undefined,
	goToNextStep: () => undefined,
	goToFinalStep: () => undefined,
});

export const useSetupWizardContext = (): SetupWizarContextValue => useContext(SetupWizardContext);
