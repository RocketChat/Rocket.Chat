import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';

import { useRole } from '../../../contexts/AuthorizationContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useUserId, useUser } from '../../../contexts/UserContext';

export const useRouteLock = (): boolean => {
	const [locked, setLocked] = useState(true);
	const setupWizardState = useSetting('Show_Setup_Wizard');
	const userId = useUserId();
	const user = useDebouncedValue(useUser(), 100);
	const hasAdminRole = useRole('admin');
	const homeRoute = useRoute('home');

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
			homeRoute.replace();
			return;
		}

		setLocked(false);
	}, [homeRoute, setupWizardState, userId, user, hasAdminRole, locked]);

	return locked;
};
