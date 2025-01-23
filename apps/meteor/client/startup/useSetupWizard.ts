import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { hasRole } from '../../app/authorization/client';
import { router } from '../providers/RouterProvider';

export const useSetupWizard = (): void => {
	const userId = useUserId();
	const setupWizardState = useSetting('Show_Setup_Wizard');

	const isWizardInProgress = userId && hasRole(userId, 'admin') && setupWizardState === 'in_progress';
	const mustRedirect = (!userId && setupWizardState === 'pending') || isWizardInProgress;
	useEffect(() => {
		if (mustRedirect) {
			router.navigate('/setup-wizard');
		}
	}, [mustRedirect]);
};
