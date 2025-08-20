import { Box } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import { useLayout, useSetting, useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import AccessibilityShortcut from './AccessibilityShortcut';
import MainContent from './MainContent';
import { MainLayoutStyleTags } from './MainLayoutStyleTags';
import NavBar from '../../../NavBarV2';
import Sidebar from '../../../sidebarv2';
import NavigationRegion from '../../navigation';
import RoomsNavigationProvider from '../../navigation/providers/RoomsNavigationProvider';

const LayoutWithSidebarV2 = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();

	const currentRoutePath = useCurrentRoutePath();
	const router = useRouter();
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

		router.navigate({ name: `/channel/${firstChannelAfterLogin}` as keyof IRouterPaths });
	}, [router, currentRoutePath, firstChannelAfterLogin]);

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
					<FeaturePreview feature='sidebarFilters'>
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

export default LayoutWithSidebarV2;
