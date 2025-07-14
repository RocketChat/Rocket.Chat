import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { DarkModeProvider } from '@rocket.chat/layout';
import { ModalRegion } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

import SetupWizardPage from './SetupWizardPage';
import { useBodyPosition } from './hooks/useBodyPosition';
import { useRouteLock } from './hooks/useRouteLock';
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
		<SetupWizardProvider>
			<DarkModeProvider.default>
				<SetupWizardPage />
				<ModalRegion />
			</DarkModeProvider.default>
		</SetupWizardProvider>
	);
};

export default SetupWizardRoute;
