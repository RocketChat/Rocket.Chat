import { SidebarV2 } from '@rocket.chat/fuselage';
import { memo } from 'react';

import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import BannerSection from './sections/BannerSection';

const Sidebar = () => (
	<SidebarV2 aria-label='sidebar' className={['rcx-sidebar--main', 'rcx-sidebar'].filter(Boolean).join(' ')}>
		<BannerSection />
		<SidebarRoomList />
		<SidebarFooter />
	</SidebarV2>
);

export default memo(Sidebar);
