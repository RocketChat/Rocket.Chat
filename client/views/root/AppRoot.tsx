import React, { FC, lazy, Suspense } from 'react';

import { VoiceRoomProvider } from '../room/providers/VoiceRoomProvider';
import PageLoading from './PageLoading';

const ConnectionStatusBar = lazy(
	() => import('../../components/connectionStatus/ConnectionStatusBar'),
);
const MeteorProvider = lazy(() => import('../../providers/MeteorProvider'));
const BannerRegion = lazy(() => import('../banners/BannerRegion'));
const AppLayout = lazy(() => import('./AppLayout'));
const PortalsWrapper = lazy(() => import('./PortalsWrapper'));

const AppRoot: FC = () => (
	<Suspense fallback={<PageLoading />}>
		<MeteorProvider>
			<VoiceRoomProvider>
				<ConnectionStatusBar />
				<BannerRegion />
				<AppLayout />
				<PortalsWrapper />
			</VoiceRoomProvider>
		</MeteorProvider>
	</Suspense>
);

export default AppRoot;
