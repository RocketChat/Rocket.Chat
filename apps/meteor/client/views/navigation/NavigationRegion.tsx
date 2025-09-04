import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useLayout, useLayoutSizes } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { FocusScope } from 'react-aria';

import Sidebar from './sidebar';
import SidePanel from './sidepanel';
import { NAVIGATION_REGION_ID } from '../../lib/constants';

const NavigationRegion = () => {
	const {
		isTablet,
		sidebar,
		sidePanel: { displaySidePanel },
	} = useLayout();
	const { sidebar: sidebarSize } = useLayoutSizes();

	const navMobileStyle = css`
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

		.hidden-visibility {
			visibility: hidden;
		}
	`;

	const navBackdropStyle = css`
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

	const sidebarWrapStyle = css`
		width: ${sidebarSize};
		min-width: ${sidebarSize};
		transition: transform 0.3s;

		&.collapsed {
			transform: translateX(-${sidebarSize});
			margin-right: -${sidebarSize};
		}
	`;

	const showSideBar = !displaySidePanel || !isTablet;
	const isSidebarOpen = !sidebar.isCollapsed && isTablet;
	const hideSidePanel = sidebar.overlayed || (sidebar.isCollapsed && isTablet);

	return (
		<>
			<Box id={NAVIGATION_REGION_ID} className={[navRegionStyle, isSidebarOpen && 'opened', isTablet && navMobileStyle].filter(Boolean)}>
				{showSideBar && (
					<Box className={[sidebarWrapStyle, sidebar.overlayed && !isSidebarOpen && 'collapsed hidden-visibility']}>
						<FocusScope>
							<Sidebar />
						</FocusScope>
					</Box>
				)}
				{displaySidePanel && (
					<Box width='x280' className={[hideSidePanel && 'hidden-visibility']}>
						<FocusScope>
							<SidePanel />
						</FocusScope>
					</Box>
				)}
			</Box>
			{isTablet && (
				<Box className={[navBackdropStyle, !sidebar.isCollapsed && 'opened'].filter(Boolean)} onClick={() => sidebar.toggle()} />
			)}
		</>
	);
};

export default memo(NavigationRegion);
