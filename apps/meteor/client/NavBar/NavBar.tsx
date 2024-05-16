import { NavBar as NavBarComponent, NavBarSection, NavBarGroup, NavBarDivider } from '@rocket.chat/fuselage';
import { usePermission, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useHasLicenseModule } from '../../ee/client/hooks/useHasLicenseModule';
import { useIsCallEnabled, useIsCallReady } from '../contexts/CallContext';
import { useOmnichannelEnabled } from '../hooks/omnichannel/useOmnichannelEnabled';
import { useOmnichannelShowQueueLink } from '../hooks/omnichannel/useOmnichannelShowQueueLink';
import UserMenu from '../sidebar/header/UserMenu';
import {
	NavBarItemOmniChannelCallDialPad,
	NavBarItemOmnichannelContact,
	NavBarItemOmnichannelLivechatToggle,
	NavBarItemOmnichannelQueue,
	NavBarItemOmnichannelCallToggle,
} from './Omnichannel';
import {
	NavBarItemManageMenu,
	NavBarItemMarketPlaceMenu,
	NavBarItemAuditMenu,
	NavBarItemDirectoryPage,
	NavBarItemHomePage,
	NavBarItemLoginPage,
} from './actions';

export const NavBar = () => {
	const t = useTranslation();
	const user = useUser();

	const hasAuditLicense = useHasLicenseModule('auditing') === true;

	const showOmnichannel = useOmnichannelEnabled();
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
					<NavBarItemHomePage title={t('Home')} />
					<NavBarItemDirectoryPage title={t('Directory')} />
					{showMarketplace && <NavBarItemMarketPlaceMenu />}
					{hasAuditLicense && <NavBarItemAuditMenu />}
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
					<NavBarItemManageMenu />
					{user ? <UserMenu user={user} /> : <NavBarItemLoginPage />}
				</NavBarGroup>
			</NavBarSection>
		</NavBarComponent>
	);
};
