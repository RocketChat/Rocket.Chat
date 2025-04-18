import { NavBarDivider, NavBarGroup, NavBarSection } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';

import NavBarPagesGroup from './NavBarPagesGroup';
import SidebarToggler from '../components/SidebarToggler';

const NavBarPagesSection = () => {
	const { isTablet } = useLayout();

	return (
		<NavBarSection>
			{isTablet && (
				<>
					<NavBarGroup>
						<SidebarToggler />
					</NavBarGroup>
					<NavBarDivider />
				</>
			)}
			<NavBarPagesGroup />
		</NavBarSection>
	);
};

export default NavBarPagesSection;
