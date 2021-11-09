import { createContext, useContext } from 'react';

export const SetupWizardContext = createContext({
	setupWizardData: {
		adminData: { fullname: '', username: '', companyEmail: '', password: '' },
		organizationData: {},
	},
	setSetupWizardData: (data: {}) => data,
	loaded: false,
	settings: [],
	canDeclineServerRegistration: false,
	goToPreviousStep: () => undefined,
	goToNextStep: () => undefined,
	goToFinalStep: () => undefined,
});

export const useSetupWizardContext = () => useContext(SetupWizardContext);
