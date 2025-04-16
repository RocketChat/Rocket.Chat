import { NavBar as NavBarComponent, NavBarSection, NavBarGroup, NavBarDivider } from '@rocket.chat/fuselage';
import { usePermission, useUser } from '@rocket.chat/ui-contexts';
import { useVoipState } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import NavbarNavigation from './NavBarNavigation';
import {
	NavBarItemOmniChannelCallDialPad,
	NavBarItemOmnichannelContact,
	NavBarItemOmnichannelLivechatToggle,
	NavBarItemOmnichannelQueue,
	NavBarItemOmnichannelCallToggle,
} from './NavBarOmnichannelToolbar';
import {
	NavBarItemMarketPlaceMenu,
	NavBarItemDirectoryPage,
	NavBarItemHomePage,
	NavBarItemCreateNew,
	NavBarItemSort,
} from './NavBarPagesToolbar';
import { NavBarItemLoginPage, NavBarItemAdministrationMenu, UserMenu } from './NavBarSettingsToolbar';
import { NavBarItemVoipDialer, NavBarItemVoipToggler } from './NavBarVoipToolbar';
import { useIsCallEnabled, useIsCallReady } from '../contexts/CallContext';
import { useOmnichannelEnabled } from '../hooks/omnichannel/useOmnichannelEnabled';
import { useOmnichannelShowQueueLink } from '../hooks/omnichannel/useOmnichannelShowQueueLink';

const NavBar = () => {
	const { t } = useTranslation();
	const user = useUser();

	const showOmnichannel = useOmnichannelEnabled();
	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');
	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;

	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const isCallEnabled = useIsCallEnabled();
	const isCallReady = useIsCallReady();
	const { isEnabled: showVoip } = useVoipState();

	return (
		<NavBarComponent aria-label='header'>
			<NavBarSection>
				<NavBarGroup aria-label={t('Pages_and_actions')}>
					<NavBarItemHomePage title={t('Home')} />
					<NavBarItemDirectoryPage title={t('Directory')} />
					{showMarketplace && <NavBarItemMarketPlaceMenu />}
					<NavBarItemCreateNew />
					<NavBarItemSort />
				</NavBarGroup>
			</NavBarSection>
			<NavbarNavigation />
			<NavBarSection>
				{showVoip && (
					<>
						<NavBarGroup aria-label={t('Voice_Call')}>
							<NavBarItemVoipDialer primary={isCallEnabled} />
							<NavBarItemVoipToggler />
						</NavBarGroup>
						<NavBarDivider />
					</>
				)}
				{showOmnichannel && (
					<>
						<NavBarGroup aria-label={t('Omnichannel')}>
							{showOmnichannelQueueLink && <NavBarItemOmnichannelQueue title={t('Queue')} />}
							{isCallReady && <NavBarItemOmniChannelCallDialPad />}
							<NavBarItemOmnichannelContact title={t('Contact_Center')} />
							{isCallEnabled && <NavBarItemOmnichannelCallToggle />}
							<NavBarItemOmnichannelLivechatToggle />
						</NavBarGroup>
						<NavBarDivider />
					</>
				)}
				<NavBarGroup aria-label={t('Workspace_and_user_preferences')}>
					<NavBarItemAdministrationMenu />
					{user ? <UserMenu user={user} /> : <NavBarItemLoginPage />}
				</NavBarGroup>
			</NavBarSection>
		</NavBarComponent>
	);
};

export default NavBar;
