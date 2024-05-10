import { NavBar as NavBarComponent, NavBarSection, NavBarGroup, NavBarDivider } from '@rocket.chat/fuselage';
import { usePermission, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useIsCallEnabled, useIsCallReady } from '../contexts/CallContext';
import { useOmnichannelShowQueueLink } from '../hooks/omnichannel/useOmnichannelShowQueueLink';
import UserMenu from '../sidebar/header/UserMenu';
import {
	NavBarItemOmniChannelCallDialPad,
	NavBarItemOmnichannelContact,
	NavBarItemOmnichannelLivechatToggle,
	NavBarItemOmnichannelQueue,
	NavBarItemOmnichannelCallToggle,
} from './Omnichannel';
import NavBarAdministrationMenu from './actions/Administration';
import NavBarAuditMenu from './actions/Audit.tsx';
import { NavBarPageDirectory, NavBarPageHome, NavBarPageMarketPlace } from './pages';

export const NavBar = () => {
	const t = useTranslation();
	const user = useUser();

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
						<NavBarItemOmnichannelContact title={t('Contacts')} />
						{isCallEnabled && <NavBarItemOmnichannelCallToggle />}
						<NavBarItemOmnichannelLivechatToggle />
					</NavBarGroup>
				)}
			</NavBarSection>
			<NavBarSection>
				<NavBarGroup>
					<NavBarAdministrationMenu />
					{user && <UserMenu user={user} />}
				</NavBarGroup>
			</NavBarSection>
		</NavBarComponent>
	);
};
