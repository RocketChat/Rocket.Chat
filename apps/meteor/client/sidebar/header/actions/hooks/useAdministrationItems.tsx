import {
	useTranslation,
	useRoute,
	useSetModal,
	useRole,
	useRouter,
	useAtLeastOnePermission,
	usePermission,
} from '@rocket.chat/ui-contexts';
import React, { lazy } from 'react';

import type { UpgradeTabVariant } from '../../../../../lib/upgradeTab';
import { getUpgradeTabLabel, isFullyFeature } from '../../../../../lib/upgradeTab';
import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import { useRegistrationStatus } from '../../../../hooks/useRegistrationStatus';
import { useUpgradeTabParams } from '../../../../views/hooks/useUpgradeTabParams';

const Emoji = lazy(() => import('../../../../components/Emoji'));
const RegisterWorkspaceModal = lazy(() => import('../../../../views/admin/cloud/modals/RegisterWorkspaceModal'));

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

	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();
	const shouldShowEmoji = isFullyFeature(tabType);

	const label = getUpgradeTabLabel(tabType);

	const isAdmin = useRole('admin');
	const setModal = useSetModal();

	const { data: registrationStatusData } = useRegistrationStatus();
	const workspaceRegistered = registrationStatusData?.registrationStatus?.workspaceRegistered ?? false;

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisterWorkspaceModal onClose={handleModalClose} />);
	};

	const adminRoute = useRoute('admin-index');
	const upgradeRoute = useRoute('upgrade');
	const cloudRoute = useRoute('cloud');

	const omnichannel = usePermission('view-livechat-manager');

	const showUpgradeItem = !isLoading && tabType;

	const omnichannelItem: GenericMenuItemProps = {
		id: 'omnichannel',
		content: t('Omnichannel'),
		icon: 'headset',
		onClick: () => router.navigate('/omnichannel/current'),
	};

	const upgradeItem: GenericMenuItemProps = {
		id: 'showUpgradeItem',
		content: (
			<>
				{t(label)} {shouldShowEmoji && <Emoji emojiHandle=':zap:' />}
			</>
		),
		icon: 'arrow-stack-up',
		onClick: () => {
			upgradeRoute.push({ type: tabType as UpgradeTabVariant }, trialEndDate ? { trialEndDate } : undefined);
		},
	};
	const adminItem: GenericMenuItemProps = {
		id: 'registration',
		content: workspaceRegistered ? t('Registration') : t('Register'),
		icon: 'cloud-plus',
		onClick: () => {
			if (workspaceRegistered) {
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

	return [
		showUpgradeItem && upgradeItem,
		shouldShowAdminMenu && workspaceItem,
		isAdmin && adminItem,
		omnichannel && omnichannelItem,
	].filter(Boolean) as GenericMenuItemProps[];
};
