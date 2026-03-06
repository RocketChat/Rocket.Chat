import { useRole, useRouter, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useRedirectToSetupWizard = (): void => {
  const userId = useUserId();
  const setupWizardState = useSetting('Show_Setup_Wizard');
  const router = useRouter();
  const isAdmin = useRole('admin');

  useEffect(() => {
    if (!router) {
      return;
    }

    if (setupWizardState === undefined) {
      return;
    }

    const handleRouteChange = (): void => {
      const routeName = router.getRouteName();
      if (!routeName) {
        return;
      }

      const isNotFoundPage = routeName === 'not-found';
      const isSetupWizardPage = routeName === 'setup-wizard';

      const isWizardInProgress =
        Boolean(userId) && Boolean(isAdmin) && setupWizardState === 'in_progress';

      const mustRedirect =
        (!userId && setupWizardState === 'pending') || isWizardInProgress;

      if (mustRedirect && !isNotFoundPage && !isSetupWizardPage) {
        router.navigate('/setup-wizard');
      }
    };

    // Run once for the current route
    handleRouteChange();

    // Subscribe to future route changes so the logic re-runs on navigation
    const unsubscribe = router.subscribeToRouteChange
      ? router.subscribeToRouteChange(handleRouteChange)
      : undefined;

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [userId, setupWizardState, isAdmin, router]);
};
