import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useLayout, useLayoutSizes } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { FocusScope } from 'react-aria';

import Sidebar from './Sidebar';
import SidePanel from '../views/navigation/sidepanel';

const SidebarRegion = () => {
	const {
		isTablet,
		sidebar,
		sidePanel: { displaySidePanel },
	} = useLayout();
	const { sidebar: sidebarSize } = useLayoutSizes();

	const sidebarMobileClass = css`
		position: absolute;
		user-select: none;
		transform: translate3d(-100%, 0, 0);
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
		-webkit-user-drag: none;
		touch-action: pan-y;
		will-change: transform;

		.rtl & {
			transform: translate3d(200%, 0, 0);

			&.opened {
				box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 15px 1px;
				transform: translate3d(0px, 0px, 0px);
			}
		}
	`;

	const navRegionStyle = css`
		position: relative;
		z-index: 2;
		display: flex;
		height: 100%;
		user-select: none;
		transition: transform 0.3s;

		&.opened {
			box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 15px 1px;
			transform: translate3d(0px, 0px, 0px);
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

	const sidebarStyle = css`
		width: ${sidebarSize};
		min-width: ${sidebarSize};
		transition: transform 0.3s;

		&.collapsed {
			transform: translateX(-${sidebarSize});
			margin-right: -${sidebarSize};
			visibility: hidden;
		}
	`;

	const showSideBar = !displaySidePanel || !isTablet;
	const isSidebarOpen = !sidebar.isCollapsed && isTablet;

	return (
		<FocusScope>
			<Box id='navigation-region' className={[navRegionStyle, isSidebarOpen && 'opened', isTablet && sidebarMobileClass].filter(Boolean)}>
				{showSideBar && (
					<Box className={[sidebarStyle, sidebar.overlayed && isTablet && 'collapsed']}>
						<Sidebar />
					</Box>
				)}
				{displaySidePanel && <SidePanel />}
			</Box>
			{isTablet && (
				<Box className={[sidebarWrapStyle, !sidebar.isCollapsed && 'opened'].filter(Boolean)} onClick={() => sidebar.toggle()} />
			)}
		</FocusScope>
	);
};

export default memo(SidebarRegion);
