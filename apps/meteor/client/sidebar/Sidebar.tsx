import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useLayout, useUserPreference } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import SidebarHeader from './header';
import BannerSection from './sections/BannerSection';
import OmnichannelSection from './sections/OmnichannelSection';
import { useOmnichannelEnabled } from '../hooks/omnichannel/useOmnichannelEnabled';

// TODO unit test airgappedbanner
const Sidebar = () => {
	const showOmnichannel = useOmnichannelEnabled();

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');
	const { sidebar } = useLayout();

	const sidebarLink = css`
		a {
			text-decoration: none;
		}
	`;

	return (
		<Box
			display='flex'
			flexDirection='column'
			height='100%'
			is='nav'
			className={[
				'rcx-sidebar--main',
				`rcx-sidebar rcx-sidebar--${sidebarViewMode}`,
				sidebarHideAvatar && 'rcx-sidebar--hide-avatar',
				sidebarLink,
			].filter(Boolean)}
			data-qa-opened={sidebar.isCollapsed ? 'false' : 'true'}
		>
			<SidebarHeader />
			<BannerSection />
			{showOmnichannel && <OmnichannelSection />}
			<SidebarRoomList />
			<SidebarFooter />
		</Box>
	);
};

export default memo(Sidebar);
