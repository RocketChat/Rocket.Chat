import { useRole, useRouter, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useRedirectToSetupWizard = (): void => {
	const userId = useUserId();
	const setupWizardState = useSetting('Show_Setup_Wizard');
	const router = useRouter();
	const isAdmin = useRole('admin');

	// Setup wizard conditions
	const isWizardInProgress =
		!!userId && !!isAdmin && setupWizardState === 'in_progress';

	const mustRedirect =
		(!userId && setupWizardState === 'pending') || isWizardInProgress;

	// Detect 404 page
	const routeName = router.getRouteName() ?? '';
	const isNotFoundPage = routeName === 'not-found';

	useEffect(() => {
		if (mustRedirect && !isNotFoundPage) {
			router.navigate('/setup-wizard');
		}
	}, [mustRedirect, isNotFoundPage]);
};
