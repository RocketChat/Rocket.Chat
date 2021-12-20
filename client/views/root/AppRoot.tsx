import React, { FC, lazy, Suspense } from 'react';
import { QueryClientProvider } from 'react-query';

import { OmnichannelRoomIconProvider } from '../../components/RoomIcon/OmnichannelRoomIcon/provider/OmnichannelRoomIconProvider';
import { queryClient } from '../../lib/queryClient';
import PageLoading from './PageLoading';

const ConnectionStatusBar = lazy(
	() => import('../../components/connectionStatus/ConnectionStatusBar'),
);
const MeteorProvider = lazy(() => import('../../providers/MeteorProvider'));
const BannerRegion = lazy(() => import('../banners/BannerRegion'));
const AppLayout = lazy(() => import('./AppLayout'));
const PortalsWrapper = lazy(() => import('./PortalsWrapper'));
const E2EEProvider = lazy(() => import('../e2ee/E2EEProvider'));

const AppRoot: FC = () => (
	<Suspense fallback={<PageLoading />}>
		<MeteorProvider>
			<QueryClientProvider client={queryClient}>
				<OmnichannelRoomIconProvider>
					<E2EEProvider>
						<ConnectionStatusBar />
						<BannerRegion />
						<AppLayout />
						<PortalsWrapper />
					</E2EEProvider>
				</OmnichannelRoomIconProvider>
			</QueryClientProvider>
		</MeteorProvider>
	</Suspense>
);

export default AppRoot;
