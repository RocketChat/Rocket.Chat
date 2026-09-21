import { Box, NavBar as NavBarComponent, NavBarSection } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import NavBarNavigation from '../../navbar/NavBarNavigation';

const SidebarRailHeader = () => {
	const { t } = useTranslation();

	return (
		<NavBarComponent aria-label={t('Sidebar_rail_header')} style={{ paddingInline: '0.5rem' }}>
			<NavBarSection>
				<Box is='img' src='/images/logo/icon.svg' alt='Rocket.Chat' size='x28' />
			</NavBarSection>
			<NavBarNavigation />
			<NavBarSection />
		</NavBarComponent>
	);
};

export default SidebarRailHeader;
