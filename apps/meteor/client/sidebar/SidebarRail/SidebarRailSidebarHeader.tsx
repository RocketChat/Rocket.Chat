import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import SidebarRailSort from './SidebarRailSort';
import NavBarItemDirectoryPage from '../../navbar/NavBarPagesGroup/NavBarItemDirectoryPage';
import NavBarItemHomePage from '../../navbar/NavBarPagesGroup/NavBarItemHomePage';

const SidebarRailSidebarHeader = () => {
	const { t } = useTranslation();

	return (
		<Box
			is='header'
			aria-label={t('Sidebar_header')}
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			paddingInline={16}
			paddingBlock={8}
		>
			<Box display='flex' alignItems='center' gap={8}>
				<NavBarItemHomePage title={t('Home')} />
				<NavBarItemDirectoryPage title={t('Directory')} />
			</Box>
			<SidebarRailSort />
		</Box>
	);
};

export default SidebarRailSidebarHeader;
