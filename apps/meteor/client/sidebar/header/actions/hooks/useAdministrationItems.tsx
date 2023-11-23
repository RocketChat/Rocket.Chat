import {
	useTranslation,
	useRoute,
	useSetModal,
	useRole,
	useRouter,
	useAtLeastOnePermission,
	usePermission,
} from '@rocket.chat/ui-contexts';
import React from 'react';

import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import { useRegistrationStatus } from '../../../../hooks/useRegistrationStatus';
import RegisterWorkspaceModal from '../../../../views/admin/cloud/modals/RegisterWorkspaceModal';

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

/**
 * @deprecated Feature preview
 * @description Should be moved to navbar when the feature became part of the core
 * @memberof navigationBar
 */

export const useAdministrationItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const router = useRouter();

	const shouldShowAdminMenu = useAtLeastOnePermission(ADMIN_PERMISSIONS);

	const isAdmin = useRole('admin');
	const setModal = useSetModal();

	const { isRegistered } = useRegistrationStatus();

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisterWorkspaceModal onClose={handleModalClose} />);
	};

	const adminRoute = useRoute('admin-index');
	const cloudRoute = useRoute('cloud');

	const omnichannel = usePermission('view-livechat-manager');

	const omnichannelItem: GenericMenuItemProps = {
		id: 'omnichannel',
		content: t('Omnichannel'),
		icon: 'headset',
		onClick: () => router.navigate('/omnichannel/current'),
	};

	const adminItem: GenericMenuItemProps = {
		id: 'registration',
		content: isRegistered ? t('Registration') : t('Register'),
		icon: 'cloud-plus',
		onClick: () => {
			if (isRegistered) {
				cloudRoute.push({ context: '/' });
				return;
			}
			handleRegisterWorkspaceClick();
		},
	};
	const workspaceItem: GenericMenuItemProps = {
		id: 'workspace',
		content: t('Workspace'),
		icon: 'cog',
		onClick: () => {
			adminRoute.push({ context: '/' });
		},
	};

	return [shouldShowAdminMenu && workspaceItem, isAdmin && adminItem, omnichannel && omnichannelItem].filter(
		Boolean,
	) as GenericMenuItemProps[];
};
