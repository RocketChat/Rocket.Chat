import { Box, NavBarGroup } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailCreateNew from './SidebarRailCreateNew';
import SidebarRailDivider from './SidebarRailDivider';
import SidebarRailLoginPage from './SidebarRailLoginPage';
import SidebarRailPhone from './SidebarRailPhone';
import NavBarItemDirectoryPage from '../../navbar/NavBarPagesGroup/NavBarItemDirectoryPage';
import NavBarItemHomePage from '../../navbar/NavBarPagesGroup/NavBarItemHomePage';
import NavBarItemMarketPlaceMenu from '../../navbar/NavBarPagesGroup/NavBarItemMarketPlaceMenu';
import { NavBarItemAdministrationMenu, UserMenu } from '../../navbar/NavBarSettingsToolbar';

const SidebarRail = () => {
	const { t } = useTranslation();
	const user = useUser();

	return (
		<Box
			is='nav'
			aria-label={t('Sidebar')}
			className='rcx-sidebar-rail'
			bg='surface-sidebar'
			borderInlineEndWidth='default'
			borderInlineEndStyle='solid'
			borderInlineEndColor='stroke-light'
			display='flex'
			flexDirection='column'
			alignItems='stretch'
			width='x44'
			height='full'
		>
			<Box flexGrow={1} minHeight={0} overflow='hidden auto' p={8}>
				<NavBarGroup vertical aria-label={t('Pages_and_actions')}>
					<SidebarRailCreateNew />
					<NavBarItemHomePage title={t('Home')} />
				</NavBarGroup>
				<SidebarRailDivider />
				<NavBarGroup vertical aria-label={t('Voice_Call')}>
					<SidebarRailPhone />
					<NavBarItemDirectoryPage title={t('Directory')} />
					<NavBarItemMarketPlaceMenu />
				</NavBarGroup>
			</Box>
			<Box p={8}>
				<NavBarGroup vertical aria-label={t('Workspace_and_user_preferences')}>
					<NavBarItemAdministrationMenu />
					{user ? <UserMenu user={user} /> : <SidebarRailLoginPage />}
				</NavBarGroup>
			</Box>
		</Box>
	);
};

export default memo(SidebarRail);
