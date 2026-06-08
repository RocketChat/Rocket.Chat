import { Box } from '@rocket.chat/fuselage';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import { useLayout, useSetting, useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import AccessibilityShortcut from './AccessibilityShortcut';
import MainContent from './MainContent';
import { MainLayoutStyleTags } from './MainLayoutStyleTags';
import SecondaryPanel from './SecondaryPanel';
import { isSidebarRailEnabled } from './sidebarRailFlag';
import NavBar from '../../../navbar';
import SidebarRail from '../../../sidebar/SidebarRail';
import SidebarRailHeader from '../../../sidebar/SidebarRail/SidebarRailHeader';

const INVALID_ROOM_NAME_PREFIXES = ['#', '?'] as const;

const LayoutWithSidebar = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout, isMobile } = useLayout();
	const showSidebarRail = isSidebarRailEnabled() && !embeddedLayout && !isMobile;

	const currentRoutePath = useCurrentRoutePath();
	const router = useRouter();
	const removeSidenav = embeddedLayout && !currentRoutePath?.startsWith('/admin');

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
			{!embeddedLayout && (showSidebarRail ? <SidebarRailHeader /> : <NavBar />)}
			<Box
				bg='surface-light'
				id='rocket-chat'
				className={[embeddedLayout ? 'embedded-view' : undefined, 'menu-nav'].filter(Boolean).join(' ')}
			>
				<MainLayoutStyleTags />
				{showSidebarRail && <SidebarRail />}
				{!removeSidenav && <SecondaryPanel showSidebarRail={showSidebarRail} currentRoutePath={currentRoutePath} />}
				<MainContent>{children}</MainContent>
			</Box>
		</>
	);
};

export default LayoutWithSidebar;
