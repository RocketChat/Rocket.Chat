import { SidebarV2 } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import SearchSection from './header/SearchSection';
import BannerSection from './sections/BannerSection';

const Sidebar = () => {
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');

	return (
		<SidebarV2
			aria-label='sidebar'
			className={['rcx-sidebar--main', `rcx-sidebar rcx-sidebar--${sidebarViewMode}`, sidebarHideAvatar && 'rcx-sidebar--hide-avatar']
				.filter(Boolean)
				.join(' ')}
		>
			<SearchSection />
			<BannerSection />
			<SidebarRoomList />
			<SidebarFooter />
		</SidebarV2>
	);
};

export default memo(Sidebar);
