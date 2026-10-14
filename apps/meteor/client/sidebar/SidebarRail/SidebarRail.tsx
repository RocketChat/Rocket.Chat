import { Box, NavBarGroup } from '@rocket.chat/fuselage';
import { usePermission, useUser } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailContactCenter from './SidebarRailContactCenter';
import SidebarRailDirectory from './SidebarRailDirectory';
import SidebarRailDivider from './SidebarRailDivider';
import SidebarRailInbox from './SidebarRailInbox';
import SidebarRailLoginPage from './SidebarRailLoginPage';
import SidebarRailMarketplace from './SidebarRailMarketplace';
import SidebarRailPhone from './SidebarRailPhone';
import SidebarRailTeams from './SidebarRailTeams';
import NavBarItemOmnichannelLivechatToggle from '../../navbar/NavBarOmnichannelGroup/NavBarItemOmnichannelLivechatToggle';
import NavBarItemOmnichannelQueue from '../../navbar/NavBarOmnichannelGroup/NavBarItemOmnichannelQueue';
import { NavBarItemAdministrationMenu, UserMenu } from '../../navbar/NavBarSettingsToolbar';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';

const SidebarRail = () => {
	const { t } = useTranslation();
	const user = useUser();

	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');
	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;
	const showOmnichannel = useOmnichannelEnabled();

	return (
		<Box
			is='nav'
			aria-label={t('Sidebar_rail')}
			className='rcx-sidebar-rail'
			backgroundColor='surface-sidebar'
			borderInlineEndWidth='default'
			borderInlineEndStyle='solid'
			borderInlineEndColor='stroke-light'
			display='flex'
			flexDirection='column'
			alignItems='stretch'
			width='x44'
			height='full'
			// secondarySidebar Feature Preview animates transitions between panels.
			// This zIndex ensures the panels transition stays behind the SideRail
			zIndex={10}
		>
			<Box flexGrow={1} minHeight={0} overflow='hidden auto' padding={8}>
				<NavBarGroup vertical aria-label={t('Pages_and_actions')}>
					<SidebarRailInbox />
					<SidebarRailTeams />
					<SidebarRailDirectory />
					{showMarketplace && <SidebarRailMarketplace />}
				</NavBarGroup>
				<SidebarRailDivider />
				<NavBarGroup vertical aria-label={t('Voice_Call')}>
					<SidebarRailPhone />
				</NavBarGroup>
				{showOmnichannel && (
					<>
						<SidebarRailDivider />
						<NavBarGroup vertical aria-label={t('Omnichannel')}>
							<NavBarItemOmnichannelQueue />
							<SidebarRailContactCenter />
							<NavBarItemOmnichannelLivechatToggle />
						</NavBarGroup>
					</>
				)}
			</Box>
			<Box padding={8}>
				<NavBarGroup vertical aria-label={t('Workspace_and_user_preferences')}>
					<NavBarItemAdministrationMenu />
					{user ? <UserMenu user={user} /> : <SidebarRailLoginPage />}
				</NavBarGroup>
			</Box>
		</Box>
	);
};

export default memo(SidebarRail);
