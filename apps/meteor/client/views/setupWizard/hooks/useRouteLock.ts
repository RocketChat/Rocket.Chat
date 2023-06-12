import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserId, useUser, useSetting, useRole, useNavigate } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

export const useRouteLock = (): boolean => {
	const [locked, setLocked] = useState(true);
	const setupWizardState = useSetting('Show_Setup_Wizard');
	const userId = useUserId();
	const user = useDebouncedValue(useUser(), 100);
	const hasAdminRole = useRole('admin');
	const navigate = useNavigate();

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
			navigate('/home');
			return;
		}

		setLocked(false);
	}, [navigate, setupWizardState, userId, user, hasAdminRole, locked]);

	return locked;
};
