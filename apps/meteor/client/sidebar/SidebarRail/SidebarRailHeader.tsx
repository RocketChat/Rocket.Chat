import { Box, NavBar as NavBarComponent, NavBarSection } from '@rocket.chat/fuselage';

import NavBarNavigation from '../../navbar/NavBarNavigation';

const SidebarRailHeader = () => (
	<NavBarComponent aria-label='header' style={{ paddingInline: '0.5rem' }}>
		<NavBarSection>
			<Box is='img' src='/images/logo/icon.svg' alt='Rocket.Chat' size='x28' />
		</NavBarSection>
		<NavBarNavigation />
		<NavBarSection />
	</NavBarComponent>
);

export default SidebarRailHeader;
