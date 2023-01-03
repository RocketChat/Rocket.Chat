import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useLayout, useUserPreference } from '@rocket.chat/ui-contexts';
import React from 'react';

import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import SidebarHeader from './header';

const Sidebar = () => {
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');
	const { isMobile, sidebar } = useLayout();

	const sideBarStyle = css`
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		flex: 0 0 var(--sidebar-width);
		width: var(--sidebar-width);
		max-width: var(--sidebar-width);
		height: 100%;
		user-select: none;
		transition: transform 0.3s;
		background-color: var(--sidebar-background);

		&.opened {
			box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 15px 1px;
			transform: translate3d(0px, 0px, 0px);
		}

		@media (width < 768px) {
			position: absolute;
			user-select: none;
			transform: translate3d(-100%, 0, 0);
			-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
			touch-action: pan-y;
			-webkit-user-drag: none;
			will-change: transform;

			.rtl & {
				transform: translate3d(200%, 0, 0);

				&.opened {
					box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 15px 1px;
					transform: translate3d(0px, 0px, 0px);
				}
			}
		}

		@media (min-width: 1372px) {
			/* 1440px -68px (eletron menu) */
			flex: 0 0 20%;

			width: 20%;
			max-width: 20%;
		}
	`;

	const sidebarWrapStyle = css`
		position: absolute;
		z-index: 1;
		top: 0;
		left: 0;
		height: 100%;
		user-select: none;
		transition: opacity 0.3s;
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
		touch-action: pan-y;
		-webkit-user-drag: none;

		&.opened {
			width: 100%;
			background-color: rgb(0, 0, 0);
			opacity: 0.8;
		}
	`;

	return (
		<>
			<Box id='sidebar-region' className={['rcx-sidebar', !sidebar.isCollapsed && isMobile && 'opened', sideBarStyle].filter(Boolean)}>
				<Box
					display='flex'
					flexDirection='column'
					height='100%'
					is='nav'
					className={[
						'rcx-sidebar--main',
						`rcx-sidebar rcx-sidebar--${sidebarViewMode}`,
						sidebarHideAvatar && 'rcx-sidebar--hide-avatar',
					].filter(Boolean)}
					role='navigation'
					data-qa-opened={sidebar.isCollapsed ? 'false' : 'true'}
				>
					<SidebarHeader />
					<SidebarRoomList />
					<SidebarFooter />
				</Box>
			</Box>
			{isMobile && (
				<Box className={[sidebarWrapStyle, !sidebar.isCollapsed && 'opened'].filter(Boolean)} onClick={() => sidebar.toggle()}></Box>
			)}
		</>
	);
};

export default Sidebar;
