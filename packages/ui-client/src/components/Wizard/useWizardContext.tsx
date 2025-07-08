import { useContext } from 'react';

import { WizardContext } from './WizardContext';

export const useWizardContext = () => {
	const context = useContext(WizardContext);

	if (!context) {
		throw new Error('useWizardContext must be used within a WizardProvider');
	}

	return context;
};
