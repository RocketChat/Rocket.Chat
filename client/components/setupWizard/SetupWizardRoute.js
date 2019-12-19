import React, { useEffect, useState } from 'react';

import { hasRole } from '../../../app/authorization/client';
import { Users } from '../../../app/models/client';
import { useRoute } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useUserId } from '../../hooks/useUserId';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { SetupWizardState } from './SetupWizardState';

const useRouteLock = () => {
	const [locked, setLocked] = useState(true);
	const setupWizardState = useSetting('Show_Setup_Wizard');
	const userId = useUserId();
	const user = useReactiveValue(() => Users.findOne(userId, { fields: { status: true } }), [userId]);
	const goToHome = useRoute('home');

	useEffect(() => {
		if (!setupWizardState) {
			return;
		}

		if (userId && (!user || !user.status)) {
			return;
		}

		const isComplete = setupWizardState === 'completed';
		const noUserLoggedInAndIsNotPending = locked && !user && setupWizardState !== 'pending';
		const userIsLoggedInButIsNotAdmin = !!user && !hasRole(user._id, 'admin');

		const mustRedirect = isComplete || noUserLoggedInAndIsNotPending || userIsLoggedInButIsNotAdmin;

		if (mustRedirect) {
			goToHome.replacingState();
			return;
		}

		setLocked(false);
	}, [setupWizardState, userId, user]);

	return locked;
};

export function SetupWizardRoute() {
	const locked = useRouteLock();

	if (locked) {
		return null;
	}

	return <SetupWizardState />;
}
