import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { DarkModeProvider } from '@rocket.chat/layout';
import React, { ReactElement } from 'react';

import SetupWizardPage from './SetupWizardPage';
import { useBodyPosition } from './hooks/useBodyPosition';
import { useRouteLock } from './hooks/useRouteLock';
import OnboardingI18nProvider from './providers/OnboardingI18nProvider';
import SetupWizardProvider from './providers/SetupWizardProvider';

export const SetupWizardRoute = (): ReactElement | null => {
	const locked = useRouteLock();
	const breakpoints = useBreakpoints();
	const isMobile = !breakpoints.includes('md');
	useBodyPosition('relative', isMobile);

	if (locked) {
		return null;
	}

	return (
		<OnboardingI18nProvider>
			<SetupWizardProvider>
				<DarkModeProvider.default>
					<SetupWizardPage />
				</DarkModeProvider.default>
			</SetupWizardProvider>
		</OnboardingI18nProvider>
	);
};

export default SetupWizardRoute;
