import { NavBarDivider, NavBarGroup, NavBarSection } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';

import NavBarPagesGroup from './NavBarPagesGroup';
import SidebarToggler from '../components/SidebarToggler';

const NavBarPagesSection = () => {
	const { isCompactScreen } = useLayout();

	return (
		<NavBarSection>
			{isCompactScreen && (
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
