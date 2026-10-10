import { useRole, useRouter, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useRedirectToSetupWizard = (): void => {
  const userId = useUserId();
  const setupWizardState = useSetting('Show_Setup_Wizard');
  const router = useRouter();
  const isAdmin = useRole('admin');

  useEffect(() => {
      return;
    }
    const routeName = router.getRouteName();
    if (!routeName) return;
      return;
    }

    const handleRouteChange = (): void => {
      const routeName = router.getRouteName();
      if (!routeName) {
        return;
      }

      const isNotFoundPage = routeName === 'not-found';
      const isSetupWizardPage = routeName === 'setup-wizard';

	const userId = useUserId();
	const setupWizardState = useSetting('Show_Setup_Wizard');
	const router = useRouter();
	const isAdmin = useRole('admin');

	useEffect(() => {
		if (!router) return;
		if (setupWizardState === undefined) return;

		const routeName = router.getRouteName();
		if (!routeName) return;

		const isNotFoundPage = routeName === 'not-found';

		const isWizardInProgress =
			Boolean(userId) && Boolean(isAdmin) && setupWizardState === 'in_progress';

		const mustRedirect =
			(!userId && setupWizardState === 'pending') || isWizardInProgress;

		if (mustRedirect && !isNotFoundPage) {
			router.navigate('/setup-wizard');
		}
	}, [userId, setupWizardState, isAdmin, router]);
};
