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

	const firstChannelAfterLogin = useSetting('First_Channel_After_Login');

	const redirected = useRef(false);

	useEffect(() => {
		const needToBeRedirect = currentRoutePath && ['/', '/home'].includes(currentRoutePath);

		if (!needToBeRedirect) {
			return;
		}

		if (!firstChannelAfterLogin || typeof firstChannelAfterLogin !== 'string') {
			return;
		}

		if (redirected.current) {
			return;
		}
		redirected.current = true;

		channelRoute.push({ name: firstChannelAfterLogin });
	}, [channelRoute, currentRoutePath, firstChannelAfterLogin]);

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
