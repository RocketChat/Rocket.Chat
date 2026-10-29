import { css } from '@rocket.chat/css-in-js';
import { Box, NavBar as NavBarComponent, NavBarSection, useStyle } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import { useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import NavBarItemOngoingCalls from '../../navbar/NavBarItemOngoingCalls';
import NavBarNavigation from '../../navbar/NavBarNavigation';

// The rail is narrower than the NavBar's inline padding allows; `[class][class]` outranks the frame's own padding
const narrowNavBar = css`
	&[class][class] {
		padding-inline: 0.5rem;
	}
`;

const SidebarRailHeader = () => {
	const { t } = useTranslation();
	const narrowNavBarClassName = useStyle(narrowNavBar);
	const user = useUser();
	const showOngoingCalls = useVideoConfWindowEnabled();

	return (
		<NavBarComponent aria-label={t('Sidebar_rail_header')} className={narrowNavBarClassName}>
			<NavBarSection>
				<Box is='img' src='/images/logo/icon.svg' alt='Rocket.Chat' size='x28' />
			</NavBarSection>
			<NavBarNavigation />
			<NavBarSection>{user && showOngoingCalls && <NavBarItemOngoingCalls />}</NavBarSection>
		</NavBarComponent>
	);
};

export default SidebarRailHeader;
