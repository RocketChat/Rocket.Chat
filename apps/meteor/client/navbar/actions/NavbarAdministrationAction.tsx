import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter, useTranslation, useAtLeastOnePermission, useRoute } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import { AccountBox } from '../../../app/ui-utils/client';
import { isAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import type { AccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import type { UpgradeTabVariant } from '../../../lib/upgradeTab';
import { getUpgradeTabLabel, isFullyFeature } from '../../../lib/upgradeTab';
import Emoji from '../../components/Emoji';
import GenericMenu from '../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../components/GenericMenu/GenericMenuItem';
import { useHandleMenuAction } from '../../components/GenericMenu/hooks/useHandleMenuAction';
import { NavbarAction } from '../../components/Navbar';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useUpgradeTabParams } from '../../views/hooks/useUpgradeTabParams';

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

const NavbarAdministrationAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();
	const router = useRouter();

	// const routeName = router.getRouteName();
	const getAccountBoxItems = useMutableCallback(() => AccountBox.getItems());
	const accountBoxItems = useReactiveValue(getAccountBoxItems);

	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();
	const shouldShowEmoji = isFullyFeature(tabType);
	const label = getUpgradeTabLabel(tabType);
	const hasAdminPermission = useAtLeastOnePermission(ADMIN_PERMISSIONS);

	const upgradeRoute = useRoute('upgrade');

	const showUpgradeItem = !isLoading && tabType;
	const showWorkspace = hasAdminPermission;

	const adminBoxItems = accountBoxItems.filter((item): item is AccountBoxItem => !isAppAccountBoxItem(item));

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

	const workspaceItem: GenericMenuItemProps = {
		id: 'workspace',
		content: t('Workspace'),
		onClick: () => {
			router.navigate('/admin');
		},
	};

	const accountBoxItem: GenericMenuItemProps[] = adminBoxItems.map((item, key) => {
		const action = () => {
			if (item.href) {
				router.navigate(item.href);
			}
		};
		return {
			id: `account-box-item-${key}`,
			content: t(item.name),
			onClick: action,
		};
	});

	const administrationItems = [
		...(showUpgradeItem ? [upgradeItem] : []),
		...(showWorkspace ? [workspaceItem] : []),
		...(accountBoxItems.length ? accountBoxItem : []),
	];

	const handleAction = useHandleMenuAction(administrationItems);

	return (
		<NavbarAction {...props}>
			<GenericMenu
				// pressed={routeName === 'cloud'}
				medium
				title={t('Administration')}
				icon='cog'
				onAction={handleAction}
				items={administrationItems}
			/>
		</NavbarAction>
	);
};

export default NavbarAdministrationAction;
