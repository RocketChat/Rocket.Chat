import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useLayout, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useOmnichannelEnabled } from '../hooks/omnichannel/useOmnichannelEnabled';
import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import SidebarHeader from './header';
import OmnichannelSection from './sections/OmnichannelSection';
import StatusDisabledSection from './sections/StatusDisabledSection';

const Sidebar = () => {
	const showOmnichannel = useOmnichannelEnabled();

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');
	const { sidebar } = useLayout();
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
			data-qa-opened={sidebar.isCollapsed ? 'false' : 'true'}
		>
			<SidebarHeader />
			{presenceDisabled && !bannerDismissed && <StatusDisabledSection onDismiss={() => setBannerDismissed(true)} />}
			{showOmnichannel && <OmnichannelSection />}
			<SidebarRoomList />
			<SidebarFooter />
		</Box>
	);
};

export default memo(Sidebar);
