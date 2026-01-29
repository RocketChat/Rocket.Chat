import { useRole, useRouter, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useRedirectToSetupWizard = (): void => {
  const userId = useUserId();
  const setupWizardState = useSetting('Show_Setup_Wizard');
  const router = useRouter();
  const isAdmin = useRole('admin');

  useEffect(() => {
    //Guards – wait until data loads
    if (!router) return;
    if (setupWizardState === undefined) return;

    //  Current route
    const routeName = router.getRouteName() ?? '';
    const isNotFoundPage = routeName === 'not-found';

    //  Conditions
    const isWizardInProgress =
      Boolean(userId) && Boolean(isAdmin) && setupWizardState === 'in_progress';

    const mustRedirect =
      (!userId && setupWizardState === 'pending') || isWizardInProgress;

    // Redirect only if needed
    if (mustRedirect && !isNotFoundPage) {
      router.navigate('/setup-wizard');
    }
  }, [userId, setupWizardState, isAdmin, router]);
};
