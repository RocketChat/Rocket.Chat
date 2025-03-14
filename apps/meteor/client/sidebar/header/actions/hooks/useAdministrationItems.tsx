import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation, useRoute, useRouter, useAtLeastOnePermission, usePermission } from '@rocket.chat/ui-contexts';

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

export const useAdministrationItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const router = useRouter();

	const shouldShowAdminMenu = useAtLeastOnePermission(ADMIN_PERMISSIONS);

	const adminRoute = useRoute('admin-index');

	const omnichannel = usePermission('view-livechat-manager');

	const omnichannelItem: GenericMenuItemProps = {
		id: 'omnichannel',
		content: t('Omnichannel'),
		icon: 'headset',
		onClick: () => router.navigate('/omnichannel/current'),
	};

	const workspaceItem: GenericMenuItemProps = {
		id: 'workspace',
		content: t('Workspace'),
		icon: 'cog',
		onClick: () => {
			adminRoute.push({ context: '/' });
		},
	};

	return [shouldShowAdminMenu && workspaceItem, omnichannel && omnichannelItem].filter(Boolean) as GenericMenuItemProps[];
};
