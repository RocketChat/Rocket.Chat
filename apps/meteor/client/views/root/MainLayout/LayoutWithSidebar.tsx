import { Box } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import { useLayout, useSetting, useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import AccessibilityShortcut from './AccessibilityShortcut';
import MainContent from './MainContent';
import { MainLayoutStyleTags } from './MainLayoutStyleTags';
import NavBar from '../../../navbar';
import Sidebar from '../../../sidebar';
import NavigationRegion from '../../navigation';
import RoomsNavigationProvider from '../../navigation/providers/RoomsNavigationProvider';

const INVALID_ROOM_NAME_PREFIXES = ['#', '?'] as const;

const LayoutWithSidebar = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();

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
			{!embeddedLayout && <NavBar />}
			<Box
				bg='surface-light'
				id='rocket-chat'
				className={[embeddedLayout ? 'embedded-view' : undefined, 'menu-nav'].filter(Boolean).join(' ')}
			>
				<MainLayoutStyleTags />
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
