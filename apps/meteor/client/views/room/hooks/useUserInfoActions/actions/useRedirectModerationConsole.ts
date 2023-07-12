import type { IUser } from '@rocket.chat/core-typings';
import { usePermission, useRoute, useTranslation } from '@rocket.chat/ui-contexts';

import type { Action } from '../../../../hooks/useActionSpread';

export const useRedirectModerationConsole = (uid: IUser['_id']): Action | undefined => {
	const t = useTranslation();
	const hasPermissionToView = usePermission('view-moderation-console');
	const router = useRoute('moderation-console');

	// only rediret if user has permission else return undefined
	if (!hasPermissionToView) {
		return;
	}

	const redirectModerationConsoleAction = () => {
		router.push({ uid });
	};

	return {
		label: t('Moderation_Action_View_reports'),
		icon: 'warning' as const,
		action: redirectModerationConsoleAction,
	};
};
