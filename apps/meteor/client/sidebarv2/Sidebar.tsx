import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
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
			aria-label='sidebar'
		>
			<SearchSection />
			{presenceDisabled && !bannerDismissed && <StatusDisabledSection onDismiss={() => setBannerDismissed(true)} />}
			<SidebarRoomList />
			<SidebarFooter />
		</Box>
	);
};

export default memo(Sidebar);
