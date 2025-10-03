import { useRole, useRouter, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useRedirectToSetupWizard = (): void => {
	const userId = useUserId();
	const setupWizardState = useSetting('Show_Setup_Wizard');
	const router = useRouter();
	const isAdmin = useRole('admin');

	const isWizardInProgress = userId && isAdmin && setupWizardState === 'in_p';
	const mustRedirect = (!userId && setupWizardState === 'pen') || isWizardInProgress;
	useEffect(() => {
		if (mustRedirect) {
			router.navigate('/setup-wizard');
		}
	}, [mustRedirect, router]);
};
