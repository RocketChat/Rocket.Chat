import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAtLeastOnePermission, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

const ADMIN_PERMISSIONS = [
	'view-statistics',
	'run-import',
	'view-user-administration',
	'view-room-administration',
	'create-invite-links',
	'manage-cloud',
	'view-logs',
	'manage-sounds',
	'view-federation-data',
	'manage-email-inbox',
	'manage-emoji',
	'manage-outgoing-integrations',
	'manage-own-outgoing-integrations',
	'manage-incoming-integrations',
	'manage-own-incoming-integrations',
	'manage-oauth-apps',
	'access-mailer',
	'manage-user-status',
	'access-permissions',
	'access-setting-permissions',
	'view-privileged-setting',
	'edit-privileged-setting',
	'manage-selected-settings',
	'view-engagement-dashboard',
	'view-moderation-console',
];

export const useAdministrationMenu = () => {
	const router = useRouter();
	const { t } = useTranslation();

	const isAdmin = useAtLeastOnePermission(ADMIN_PERMISSIONS);
	const isOmnichannel = usePermission('view-livechat-manager');

	const workspace: GenericMenuItemProps = {
		id: 'workspace',
		content: t('Workspace'),
		onClick: () => router.navigate('/admin'),
	};
	const omnichannel: GenericMenuItemProps = {
		id: 'omnichannel',
		content: t('Omnichannel'),
		onClick: () => router.navigate('/omnichannel/current'),
	};

	return {
		title: t('Manage'),
		items: [isAdmin && workspace, isOmnichannel && omnichannel].filter(Boolean) as GenericMenuItemProps[],
	};
};
