import type { IUser } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';

import type { Action } from '../../../../hooks/useActionSpread';

export const useRedirectModerationConsole = (uid: IUser['_id']): Action | undefined => {
	const hasPermissionToView = usePermission('view-moderation-console');

	// only rediret if user has permission else return undefined
	if (!hasPermissionToView) {
		return;
	}

	const redirectModerationConsoleAction = () => {
		window.open(`/admin/moderation-console/info/${uid}`);
	};

	return {
		label: 'View Reported Messages',
		icon: 'warning' as const,
		action: redirectModerationConsoleAction,
	};
};
