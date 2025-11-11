import { NavBarDivider, NavBarGroup, NavBarSection } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';

import NavBarPagesGroup from './NavBarPagesGroup';
import { SidebarTogglerV2 } from '../components/SidebarTogglerV2';

const NavBarPagesSection = () => {
	const { sidebar } = useLayout();

	return (
		<NavBarSection>
			{sidebar.shouldToggle && (
				<>
					<NavBarGroup>
						<SidebarTogglerV2 />
					</NavBarGroup>
					<NavBarDivider />
				</>
			)}
			<NavBarPagesGroup />
		</NavBarSection>
	);
};

export default NavBarPagesSection;
