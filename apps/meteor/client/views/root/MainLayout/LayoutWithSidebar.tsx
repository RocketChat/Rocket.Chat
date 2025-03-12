import { Box } from '@rocket.chat/fuselage';
import { useLayout, useSetting, useRoute, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import AccessibilityShortcut from './AccessibilityShortcut';
import { MainLayoutStyleTags } from './MainLayoutStyleTags';
import Sidebar from '../../../sidebar';

const LayoutWithSidebar = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();

	const currentRoutePath = useCurrentRoutePath();
	const channelRoute = useRoute('channel');
	const removeSidenav = embeddedLayout && !currentRoutePath?.startsWith('/admin');
	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Store_Users');

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
			<main
				id='main-content'
				className={['main-content', readReceiptsEnabled ? 'read-receipts-enabled' : undefined].filter(Boolean).join(' ')}
			>
				{children}
			</main>
		</Box>
	);
};

export default LayoutWithSidebar;
