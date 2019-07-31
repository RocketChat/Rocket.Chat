import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useEffect, useState } from 'react';
import { Tracker } from 'meteor/tracker';

import { hasRole } from '../../../app/authorization';
import { Users } from '../../../app/models';
import { useSetting } from '../../hooks/useSetting';
import { useUserId } from '../../hooks/useUserId';

export function StateChecker({ children }) {
	const setupWizardState = useSetting('Show_Setup_Wizard');
	const userId = useUserId();

	const [renderAllowed, allowRender] = useState(false);

	useEffect(() => {
		if (!setupWizardState) {
			return;
		}

		const user = Tracker.nonreactive(() => Users.findOne(userId, { fields: { status: true } }));

		if (userId && (!user || !user.status)) {
			return;
		}

		const isComplete = setupWizardState === 'completed';
		const noUserLoggedInAndIsNotPending = !user && setupWizardState !== 'pending';
		const userIsLoggedInButIsNotAdmin = !!user && !hasRole(user._id, 'admin');

		const mustRedirect = isComplete || noUserLoggedInAndIsNotPending || userIsLoggedInButIsNotAdmin;

		if (mustRedirect) {
			FlowRouter.withReplaceState(() => {
				FlowRouter.go('home');
			});
			return;
		}

		const initialPageLoadingElement = document.getElementById('initial-page-loading');
		if (initialPageLoadingElement) {
			initialPageLoadingElement.remove();
		}

		allowRender(true);
	}, [setupWizardState, userId]);

	if (!renderAllowed) {
		return null;
	}

	return <>{children}</>;
}
