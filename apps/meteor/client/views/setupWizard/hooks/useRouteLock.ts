import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserId, useUser, useSetting, useRole, useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

export const useRouteLock = (): boolean => {
	const [locked, setLocked] = useState(true);
	const setupWizardState = useSetting('Show_Setup_Wizard');
	const userId = useUserId();
	const user = useDebouncedValue(useUser(), 100);
	const hasAdminRole = useRole('admin');
	const router = useRouter();

	useEffect(() => {
		if (!setupWizardState) {
			return;
		}

		if (userId && !user?.status) {
			return;
		}

		const isComplete = setupWizardState === 'completed';
		const noUserLoggedInAndIsNotPending = locked && !user && setupWizardState !== 'pending';
		const userIsLoggedInButIsNotAdmin = !!user && !hasAdminRole;

		const mustRedirect = isComplete || noUserLoggedInAndIsNotPending || userIsLoggedInButIsNotAdmin;

		if (mustRedirect) {
			router.navigate('/home');
			return;
		}

		setLocked(false);
	}, [router, setupWizardState, userId, user, hasAdminRole, locked]);

	return locked;
};
