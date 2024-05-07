import { NavBar as NavBarComponent, NavBarSection, NavBarGroup, NavBarDivider } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission, usePermission, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useIsCallEnabled, useIsCallReady } from '../contexts/CallContext';
import { useOmnichannelShowQueueLink } from '../hooks/omnichannel/useOmnichannelShowQueueLink';
import UserMenu from '../sidebar/header/UserMenu';
import {
	NavBarItemOmniChannelCallDialPad,
	NavBarItemOmnichannel,
	NavBarItemOmnichannelContact,
	NavBarItemOmnichannelLivechatToggle,
	NavBarItemOmnichannelQueue,
	NavBarItemOmnichannelCallToggle,
} from './Omnichannel';
import NavBarAuditMenu from './actions/Audit.tsx';
import { NavBarPageAdmin, NavBarPageDirectory, NavBarPageHome, NavBarPageMarketPlace } from './pages';

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

	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const isCallEnabled = useIsCallEnabled();
	const isCallReady = useIsCallReady();

	return (
		<NavBarComponent>
			<NavBarSection>
				<NavBarGroup role='toolbar'>
					<NavBarPageHome title={t('Home')} />
					<NavBarPageDirectory title={t('Directory')} />
					{showMarketplace && <NavBarPageMarketPlace title={t('Marketplace')} />}
					<NavBarAuditMenu />
				</NavBarGroup>
				<NavBarDivider />
				{showOmnichannel && (
					<NavBarGroup role='toolbar'>
						{showOmnichannelQueueLink && <NavBarItemOmnichannelQueue title={t('Queue')} />}
						{isCallReady && <NavBarItemOmniChannelCallDialPad />}
						<NavBarItemOmnichannel title={t('Omnichannel')} />
						<NavBarItemOmnichannelContact title={t('Contacts')} />
						{isCallEnabled && <NavBarItemOmnichannelCallToggle />}
						<NavBarItemOmnichannelLivechatToggle />
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
