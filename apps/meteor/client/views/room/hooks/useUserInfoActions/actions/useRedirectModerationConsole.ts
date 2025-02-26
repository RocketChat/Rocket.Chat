import type { IUser } from '@rocket.chat/core-typings';
import { usePermission, useRoute } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

export const useRedirectModerationConsole = (uid: IUser['_id']): UserInfoAction | undefined => {
	const { t } = useTranslation();
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
		content: t('Moderation_Action_View_reports'),
		icon: 'warning',
		onClick: redirectModerationConsoleAction,
		type: 'privileges' as UserInfoActionType,
	};
};
