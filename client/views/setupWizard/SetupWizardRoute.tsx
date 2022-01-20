import React, { ReactElement } from 'react';

import SetupWizardPage from './SetupWizardPage';
import { useRouteLock } from './hooks/useRouteLock';
import OnboardingI18nProvider from './providers/OnboardingI18nProvider';
import SetupWizardProvider from './providers/SetupWizardProvider';

export const SetupWizardRoute = (): ReactElement | null => {
	const locked = useRouteLock();

	if (locked) {
		return null;
	}

	return (
		<OnboardingI18nProvider>
			<SetupWizardProvider>
				<SetupWizardPage />
			</SetupWizardProvider>
		</OnboardingI18nProvider>
	);
};

export default SetupWizardRoute;
