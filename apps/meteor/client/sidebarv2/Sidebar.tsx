import { SidebarV2 } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import BannerSection from './sections/BannerSection';

const Sidebar = () => {
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');

	return (
		<SidebarV2
			aria-label='sidebar'
			className={['rcx-sidebar--main', 'rcx-sidebar', sidebarHideAvatar && 'rcx-sidebar--hide-avatar'].filter(Boolean).join(' ')}
		>
			<BannerSection />
			<SidebarRoomList />
			<SidebarFooter />
		</SidebarV2>
	);
};

export default memo(Sidebar);
