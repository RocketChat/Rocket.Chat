import { NavBar as NavBarComponent, NavBarSection, NavBarGroup, NavBarDivider } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission, usePermission, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserMenu from '../sidebar/header/UserMenu';
import NavBarPageAdmin from './pages/Admin';
import NavBarPageDirectory from './pages/Directory';
import NavBarPageHome from './pages/Home';
import NavBarPageMarketPlace from './pages/MarketPlace';
import NavBarPageOmnichannel from './pages/Omnichannel';

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

export const NavBar = () => {
	const t = useTranslation();
	const user = useUser();

	const isAdmin = useAtLeastOnePermission(ADMIN_PERMISSIONS);
	const showOmnichannel = usePermission('view-livechat-manager');
	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');
	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;

	return (
		<NavBarComponent>
			<NavBarSection>
				<NavBarGroup role='toolbar'>
					<NavBarPageHome title={t('Home')} />
					<NavBarPageDirectory title={t('Directory')} />
					{showMarketplace && <NavBarPageMarketPlace title={t('Marketplace')} />}
				</NavBarGroup>
				<NavBarDivider />
				{showOmnichannel && (
					<NavBarGroup role='toolbar'>
						<NavBarPageOmnichannel title={t('Omnichannel')} />
					</NavBarGroup>
				)}
			</NavBarSection>
			<NavBarSection>
				<NavBarGroup>
					{isAdmin && <NavBarPageAdmin title={t('Workspace')} />}
					{user && <UserMenu user={user} />}
				</NavBarGroup>
			</NavBarSection>
		</NavBarComponent>
	);
};
