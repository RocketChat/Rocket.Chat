import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import React, { lazy, memo } from 'react';

import Sidebar from './Sidebar';

const Navbar = lazy(() => import('../navbar/Navbar'));

const SidebarRegion = () => {
	const { isMobile, sidebar } = useLayout();

	const sideBarStyle = css`
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		height: 100%;
		user-select: none;
		transition: transform 0.3s;

		> .rcx-sidebar:not(:last-child) {
			visibility: hidden;
		}

		&.opened {
			box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 15px 1px;
			transform: translate3d(0px, 0px, 0px);
		}

		@media (max-width: 767px) {
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

		@media (min-width: 768px) and (max-width: 1599px) {
			width: var(--sidebar-width);
			min-width: var(--sidebar-width);
		}
		@media (min-width: 1600px) and (max-width: 1919px) {
			width: var(--sidebar-md-width);
			min-width: var(--sidebar-md-width);
		}
		@media (min-width: 1920px) {
			width: var(--sidebar-lg-width);
			min-width: var(--sidebar-lg-width);
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
			<FeaturePreview feature='navigationBar'>
				<FeaturePreviewOn>
					<Navbar />
				</FeaturePreviewOn>
				<FeaturePreviewOff>
					<></>
				</FeaturePreviewOff>
			</FeaturePreview>
			<Box id='sidebar-region' className={['rcx-sidebar', !sidebar.isCollapsed && isMobile && 'opened', sideBarStyle].filter(Boolean)}>
				<Sidebar />
			</Box>
			{isMobile && (
				<Box className={[sidebarWrapStyle, !sidebar.isCollapsed && 'opened'].filter(Boolean)} onClick={() => sidebar.toggle()}></Box>
			)}
		</>
	);
};

export default memo(SidebarRegion);
