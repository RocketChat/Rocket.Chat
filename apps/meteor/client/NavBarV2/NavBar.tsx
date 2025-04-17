import { NavBar as NavBarComponent } from '@rocket.chat/fuselage';

import NavBarControlsSection from './NavBarControls/NavBarControlsSection';
import NavBarNavigation from './NavBarNavigation';
import NavBarPagesSection from './NavBarPagesSection';

const NavBar = () => {
	return (
		<NavBarComponent aria-label='header'>
			<NavBarPagesSection />
			<NavBarNavigation />
			<NavBarControlsSection />
		</NavBarComponent>
	);
};

export default NavBar;
