import { NavBarGroup } from '@rocket.chat/fuselage';
import { useLayout, usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import NavBarItemCreateNew from './NavBarItemCreateNew';
import NavBarItemDirectoryPage from './NavBarItemDirectoryPage';
import NavBarItemHomePage from './NavBarItemHomePage';
import NavBarItemMarketPlaceMenu from './NavBarItemMarketPlaceMenu';
import NavBarItemSort from './NavBarItemSort';
import NavBarPagesStackMenu from './NavBarPagesStackMenu';

const NavBarPagesGroup = () => {
	const { t } = useTranslation();
	const { isTablet, isMobile } = useLayout();

	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');
	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;

	return (
		<NavBarGroup aria-label={t('Pages_and_actions')}>
			{isTablet && <NavBarPagesStackMenu />}
			{!isTablet && (
				<>
					<NavBarItemHomePage title={t('Home')} />
					<NavBarItemDirectoryPage title={t('Directory')} />
				</>
			)}
			{showMarketplace && !isMobile && <NavBarItemMarketPlaceMenu />}
			<NavBarItemCreateNew />
			{!isMobile && <NavBarItemSort />}
		</NavBarGroup>
	);
};

export default NavBarPagesGroup;
