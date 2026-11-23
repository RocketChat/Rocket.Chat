import { Box } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, useFeaturePreview } from '@rocket.chat/ui-client';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import { useLayout, useSetting, useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import AccessibilityShortcut from './AccessibilityShortcut';
import MainContent from './MainContent';
import { MainLayoutStyleTags } from './MainLayoutStyleTags';
import NavBar from '../../../navbar';
import Sidebar from '../../../sidebar';
import SidebarRail from '../../../sidebar/SidebarRail';
import SidebarRailHeader from '../../../sidebar/SidebarRail/SidebarRailHeader';
import NavigationRegion from '../../navigation';
import RoomsNavigationProvider from '../../navigation/providers/RoomsNavigationProvider';

const INVALID_ROOM_NAME_PREFIXES = ['#', '?'] as const;
const SIDEBAR_CLOSING_ROUTES = /^\/(directory|omnichannel-directory)(\/|$)/;

export type LayoutWithSidebarProps = { children: ReactNode };

const LayoutWithSidebar = ({ children }: LayoutWithSidebarProps) => {
	const {
		isEmbedded: embeddedLayout,
		sidebar: { shouldToggle },
	} = useLayout();

	const currentRoutePath = useCurrentRoutePath();
	const router = useRouter();
	const sidebarRailActive = useFeaturePreview('sidebarRail') && !shouldToggle && !embeddedLayout;
	const isSidebarClosingRoute = SIDEBAR_CLOSING_ROUTES.test(currentRoutePath ?? '');
	const [sidebarClosed, setSidebarClosed] = useState(() => sidebarRailActive && isSidebarClosingRoute);

	useEffect(() => {
		if (sidebarRailActive && isSidebarClosingRoute) {
			setSidebarClosed(true);
		}
	}, [sidebarRailActive, isSidebarClosingRoute]);

	const removeSidenav = (embeddedLayout && !currentRoutePath?.startsWith('/admin')) || (sidebarRailActive && sidebarClosed);

	const firstChannelAfterLogin = useSetting<string>('First_Channel_After_Login', '');
	const roomName = (firstChannelAfterLogin.startsWith('#') ? firstChannelAfterLogin.slice(1) : firstChannelAfterLogin).trim();

	const redirected = useRef(false);

	useEffect(() => {
		const needToBeRedirect = currentRoutePath && ['/', '/home'].includes(currentRoutePath);

		if (!needToBeRedirect) {
			return;
		}

		if (!roomName) {
			return;
		}

		if (INVALID_ROOM_NAME_PREFIXES.some((prefix) => roomName.startsWith(prefix))) {
			// Because this will break url routing. Eg: /channel/#roomName and /channel/?roomName which will route to path /channel
			return;
		}

		if (redirected.current) {
			return;
		}
		redirected.current = true;

		router.navigate({ name: `/channel/${roomName}` as keyof IRouterPaths });
	}, [router, currentRoutePath, roomName]);

	return (
		<>
			<AccessibilityShortcut />
			{!embeddedLayout && (
				<FeaturePreview feature='sidebarRail' disabled={shouldToggle}>
					<FeaturePreviewOn>
						<SidebarRailHeader />
					</FeaturePreviewOn>
					<FeaturePreviewOff>
						<NavBar />
					</FeaturePreviewOff>
				</FeaturePreview>
			)}
			<Box
				backgroundColor='surface-light'
				id='rocket-chat'
				className={[embeddedLayout ? 'embedded-view' : undefined, 'menu-nav'].filter(Boolean).join(' ')}
			>
				<MainLayoutStyleTags />
				<FeaturePreview feature='sidebarRail' disabled={shouldToggle || embeddedLayout}>
					<FeaturePreviewOn>
						<SidebarRail inboxOpen={!sidebarClosed} onToggleInbox={() => setSidebarClosed((closed) => !closed)} />
					</FeaturePreviewOn>
					<FeaturePreviewOff>{null}</FeaturePreviewOff>
				</FeaturePreview>
				{!removeSidenav && (
					<FeaturePreview feature='secondarySidebar'>
						<FeaturePreviewOn>
							<RoomsNavigationProvider>
								<NavigationRegion />
							</RoomsNavigationProvider>
						</FeaturePreviewOn>
						<FeaturePreviewOff>
							<Sidebar />
						</FeaturePreviewOff>
					</FeaturePreview>
				)}
				<MainContent>{children}</MainContent>
			</Box>
		</>
	);
};

export default LayoutWithSidebar;
