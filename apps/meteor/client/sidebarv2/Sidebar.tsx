import { SideBar } from '@rocket.chat/fuselage';
import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import SearchSection from './header/SearchSection';
import StatusDisabledSection from './sections/StatusDisabledSection';

const Sidebar = () => {
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');
	const [bannerDismissed, setBannerDismissed] = useSessionStorage('presence_cap_notifier', false);
	const presenceDisabled = useSetting<boolean>('Presence_broadcast_disabled');

	return (
		<SideBar
			aria-label='sidebar'
			className={['rcx-sidebar--main', `rcx-sidebar rcx-sidebar--${sidebarViewMode}`, sidebarHideAvatar && 'rcx-sidebar--hide-avatar']
				.filter(Boolean)
				.join(' ')}
		>
			<SearchSection />
			{presenceDisabled && !bannerDismissed && <StatusDisabledSection onDismiss={() => setBannerDismissed(true)} />}
			<SidebarRoomList />
			<SidebarFooter />
		</SideBar>
	);
};

export default memo(Sidebar);
