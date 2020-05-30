import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useState } from 'react';

import { useRole } from '../../contexts/AuthorizationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useUserId, useUser } from '../../contexts/UserContext';
import SetupWizardState from './SetupWizardState';

const useRouteLock = () => {
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
	}, [homeRoute, setupWizardState, userId, user, hasAdminRole]);

	return locked;
};

export function SetupWizardRoute() {
	const locked = useRouteLock();

	if (locked) {
		return null;
	}

	return <SetupWizardState />;
}

export default SetupWizardRoute;
