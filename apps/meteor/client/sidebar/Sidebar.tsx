import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { FeaturePreview, FeaturePreviewOn, FeaturePreviewOff } from '@rocket.chat/ui-client';
import { useLayout, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import RoomListPreview from './RoomList/RoomListPreview';
import RoomListStable from './RoomList/RoomListStable';
import SidebarFooter from './footer';
import SidebarHeader from './header';
import StatusDisabledSection from './sections/StatusDisabledSection';

const Sidebar = () => {
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');
	const { sidebar } = useLayout();
	const [bannerDismissed, setBannerDismissed] = useSessionStorage('presence_cap_notifier', false);
	const presenceDisabled = useSetting<boolean>('Presence_broadcast_disabled');

	const sideBarBackground = css`
		background-color: ${Palette.surface['surface-tint']};
	`;

	return (
		<>
			<Box
				display='flex'
				flexDirection='column'
				height='100%'
				is='nav'
				className={[
					'rcx-sidebar--main',
					`rcx-sidebar rcx-sidebar--${sidebarViewMode}`,
					sidebarHideAvatar && 'rcx-sidebar--hide-avatar',
					sideBarBackground,
				].filter(Boolean)}
				role='navigation'
				data-qa-opened={sidebar.isCollapsed ? 'false' : 'true'}
			>
				<SidebarHeader />
				{presenceDisabled && !bannerDismissed && <StatusDisabledSection onDismiss={() => setBannerDismissed(true)} />}

				<FeaturePreview feature='navigationBar'>
					<FeaturePreviewOn>
						<RoomListPreview />
					</FeaturePreviewOn>
					<FeaturePreviewOff>
						<RoomListStable />
					</FeaturePreviewOff>
				</FeaturePreview>

				<SidebarFooter />
			</Box>
		</>
	);
};

export default memo(Sidebar);
