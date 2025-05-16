import { NavBar as NavBarComponent } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';

import NavBarControlsSection from './NavBarControls/NavBarControlsSection';
import NavBarNavigation from './NavBarNavigation';
import NavBarPagesSection from './NavBarPagesSection';

const NavBar = () => {
	const { navbar } = useLayout();

	return (
		<NavBarComponent aria-label='header'>
			{!navbar.searchExpanded && <NavBarPagesSection />}
			<NavBarNavigation />
			{!navbar.searchExpanded && <NavBarControlsSection />}
		</NavBarComponent>
	);
};

export default NavBar;
