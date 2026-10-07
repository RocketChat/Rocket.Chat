import { Box, NavBarGroup, NavBarItem } from '@rocket.chat/fuselage';
import { usePermission, useRouter, useUser } from '@rocket.chat/ui-contexts';
import { useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import tinykeys from 'tinykeys';

import SidebarRailCreateNew from './SidebarRailCreateNew';
import SidebarRailDivider from './SidebarRailDivider';
import SidebarRailInbox from './SidebarRailInbox';
import SidebarRailLoginPage from './SidebarRailLoginPage';
import SidebarRailPhone from './SidebarRailPhone';
import SidebarRailSearch from './SidebarRailSearch';
import { useSidebarRailStore } from './useSidebarRailStore';
import NavBarItemOngoingCalls from '../../navbar/NavBarItemOngoingCalls';
import NavBarOmnichannelGroup from '../../navbar/NavBarOmnichannelGroup';
import NavBarItemMarketPlaceMenu from '../../navbar/NavBarPagesGroup/NavBarItemMarketPlaceMenu';
import { NavBarItemAdministrationMenu, UserMenu } from '../../navbar/NavBarSettingsToolbar';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';

const groupStackProps = {
	display: 'flex',
	flexDirection: 'column',
	gap: '0.5rem',
} as const;

const SidebarRail = () => {
	const { t } = useTranslation();
	const user = useUser();
	const { navigate } = useRouter();
	const setPanel = useSidebarRailStore((state) => state.setPanel);

	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');
	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;
	const showOmnichannel = useOmnichannelEnabled();
	const showOngoingCalls = useVideoConfWindowEnabled();

	useEffect(() => {
		const openSearch = (event: KeyboardEvent) => {
			event.preventDefault();
			setPanel('search');
		};

		const openInbox = (event: KeyboardEvent) => {
			event.preventDefault();
			setPanel('inbox');
		};

		return tinykeys(window, {
			'$mod+K': openSearch,
			'$mod+P': openSearch,
			'$mod+Shift+U': openInbox,
		});
	}, [setPanel]);

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
				<Box display='flex' justifyContent='center' paddingBlockStart={4}>
					<Box is='img' src='/images/logo/icon.svg' alt='Rocket.Chat' size='x28' />
				</Box>
				<SidebarRailDivider />
				<Box {...groupStackProps}>
					<NavBarGroup vertical aria-label={t('Pages_and_actions')}>
						<SidebarRailSearch />
						<SidebarRailInbox />
						<SidebarRailCreateNew />
						{showMarketplace && <NavBarItemMarketPlaceMenu />}
					</NavBarGroup>
					<NavBarGroup vertical aria-label={t('Voice_Call')}>
						<SidebarRailPhone />
						{user && showOngoingCalls && <NavBarItemOngoingCalls />}
					</NavBarGroup>
				</Box>
				{showOmnichannel && (
					<>
						<SidebarRailDivider />
						<NavBarOmnichannelGroup vertical />
					</>
				)}
			</Box>
			<Box padding={8} {...groupStackProps}>
				<NavBarGroup vertical aria-label={t('History_navigation')}>
					<NavBarItem title={t('Back_in_history')} icon='chevron-left' onClick={() => navigate(-1)} />
					<NavBarItem title={t('Forward_in_history')} icon='chevron-right' onClick={() => navigate(1)} />
				</NavBarGroup>
				<NavBarGroup vertical aria-label={t('Workspace_and_user_preferences')}>
					<NavBarItemAdministrationMenu />
					{user ? <UserMenu user={user} /> : <SidebarRailLoginPage />}
				</NavBarGroup>
			</Box>
		</Box>
	);
};

export default memo(SidebarRail);
