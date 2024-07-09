import { useToolbar } from '@react-aria/toolbar';
import { NavBar as NavBarComponent, NavBarSection, NavBarGroup, NavBarDivider } from '@rocket.chat/fuselage';
import { usePermission, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React, { useRef } from 'react';

import { useIsCallEnabled, useIsCallReady } from '../contexts/CallContext';
import { useOmnichannelEnabled } from '../hooks/omnichannel/useOmnichannelEnabled';
import { useOmnichannelShowQueueLink } from '../hooks/omnichannel/useOmnichannelShowQueueLink';
import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import {
	NavBarItemOmniChannelCallDialPad,
	NavBarItemOmnichannelContact,
	NavBarItemOmnichannelLivechatToggle,
	NavBarItemOmnichannelQueue,
	NavBarItemOmnichannelCallToggle,
} from './NavBarOmnichannelToolbar';
import { NavBarItemMarketPlaceMenu, NavBarItemAuditMenu, NavBarItemDirectoryPage, NavBarItemHomePage } from './NavBarPagesToolbar';
import { NavBarItemLoginPage, NavBarItemAdministrationMenu, UserMenu } from './NavBarSettingsToolbar';

const NavBar = () => {
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

	const pagesToolbarRef = useRef(null);
	const { toolbarProps: pagesToolbarProps } = useToolbar({ 'aria-label': t('Pages') }, pagesToolbarRef);

	const omnichannelToolbarRef = useRef(null);
	const { toolbarProps: omnichannelToolbarProps } = useToolbar({ 'aria-label': t('Omnichannel') }, omnichannelToolbarRef);

	return (
		<NavBarComponent aria-label='header'>
			<NavBarSection>
				<NavBarGroup role='toolbar' ref={pagesToolbarRef} {...pagesToolbarProps}>
					<NavBarItemHomePage title={t('Home')} />
					<NavBarItemDirectoryPage title={t('Directory')} />
					{showMarketplace && <NavBarItemMarketPlaceMenu />}
					{hasAuditLicense && <NavBarItemAuditMenu />}
				</NavBarGroup>
				{showOmnichannel && (
					<>
						<NavBarDivider />
						<NavBarGroup role='toolbar' ref={omnichannelToolbarRef} {...omnichannelToolbarProps}>
							{showOmnichannelQueueLink && <NavBarItemOmnichannelQueue title={t('Queue')} />}
							{isCallReady && <NavBarItemOmniChannelCallDialPad />}
							<NavBarItemOmnichannelContact title={t('Contacts')} />
							{isCallEnabled && <NavBarItemOmnichannelCallToggle />}
							<NavBarItemOmnichannelLivechatToggle />
						</NavBarGroup>
					</>
				)}
			</NavBarSection>
			<NavBarSection>
				<NavBarGroup aria-label={t('Workspace_and_user_settings')}>
					<NavBarItemAdministrationMenu />
					{user ? <UserMenu user={user} /> : <NavBarItemLoginPage />}
				</NavBarGroup>
			</NavBarSection>
		</NavBarComponent>
	);
};

export default NavBar;
