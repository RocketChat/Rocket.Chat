import { Box } from '@rocket.chat/fuselage';
import { useLayout, useSetting, useCurrentModal, useRoute, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

import Sidebar from '../../../sidebar';
import AccessibilityShortcut from './AccessibilityShortcut';
import { MainLayoutStyleTags } from './MainLayoutStyleTags';

const LayoutWithSidebar = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();

	const modal = useCurrentModal();
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
			aria-hidden={Boolean(modal)}
		>
			<AccessibilityShortcut />
			<MainLayoutStyleTags />
			{!removeSidenav && <Sidebar />}
			<main
				id='main-content'
				className={['rc-old', 'main-content', readReceiptsEnabled ? 'read-receipts-enabled' : undefined].filter(Boolean).join(' ')}
			>
				{children}
			</main>
		</Box>
	);
};

export default LayoutWithSidebar;
