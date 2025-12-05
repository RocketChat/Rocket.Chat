import { Box } from '@rocket.chat/fuselage';
import { useLayout, useSetting, useRoute, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import AccessibilityShortcut from './AccessibilityShortcut';
import MainContent from './MainContent';
import { MainLayoutStyleTags } from './MainLayoutStyleTags';
import Sidebar from '../../../sidebar';

const LayoutWithSidebar = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();

	const currentRoutePath = useCurrentRoutePath();
	const channelRoute = useRoute('channel');
	const removeSidenav = embeddedLayout && !currentRoutePath?.startsWith('/admin');

	const firstChannelAfterLogin = useSetting<string>('First_Channel_After_Login', '');
	const roomName = firstChannelAfterLogin.startsWith('#') ? firstChannelAfterLogin.slice(1) : firstChannelAfterLogin;

	const redirected = useRef(false);

	useEffect(() => {
		const needToBeRedirect = currentRoutePath && ['/', '/home'].includes(currentRoutePath);

		if (!needToBeRedirect) {
			return;
		}

		if (!roomName) {
			return;
		}

		if (redirected.current) {
			return;
		}

		redirected.current = true;

		channelRoute.push({ name: roomName });
	}, [channelRoute, currentRoutePath, roomName]);

	return (
		<Box
			bg='surface-light'
			id='rocket-chat'
			className={[embeddedLayout ? 'embedded-view' : undefined, 'menu-nav'].filter(Boolean).join(' ')}
		>
			<AccessibilityShortcut />
			<MainLayoutStyleTags />
			{!removeSidenav && <Sidebar />}
			<MainContent>{children}</MainContent>
		</Box>
	);
};

export default LayoutWithSidebar;
