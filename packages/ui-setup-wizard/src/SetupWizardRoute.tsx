import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { DarkModeProvider } from '@rocket.chat/layout';
import { ModalRegion } from '@rocket.chat/ui-client';

import SetupWizardPage from './SetupWizardPage.js';
import { useBodyPosition } from './hooks/useBodyPosition.js';
import { useRouteLock } from './hooks/useRouteLock.js';
import SetupWizardProvider from './providers/SetupWizardProvider.js';

export const SetupWizardRoute = () => {
	const locked = useRouteLock();
	const breakpoints = useBreakpoints();
	const isMobile = !breakpoints.includes('md');
	useBodyPosition('relative', isMobile);

	if (locked) {
		return null;
	}

	return (
		<SetupWizardProvider>
			<DarkModeProvider.default>
				<SetupWizardPage />
				<ModalRegion />
			</DarkModeProvider.default>
		</SetupWizardProvider>
	);
};

export default SetupWizardRoute;
