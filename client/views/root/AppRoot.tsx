import React, { FC, lazy, Suspense } from 'react';

import PageLoading from './PageLoading';

const ConnectionStatusBar = lazy(
	() => import('../../components/connectionStatus/ConnectionStatusBar'),
);
const MeteorProvider = lazy(() => import('../../providers/MeteorProvider'));
const BannerRegion = lazy(() => import('../banners/BannerRegion'));
const AppRoutes = lazy(() => import('./AppRoutes'));
const PortalsWrapper = lazy(() => import('./PortalsWrapper'));

const AppRoot: FC = () => (
	<Suspense fallback={<PageLoading />}>
		<MeteorProvider>
			<ConnectionStatusBar />
			<BannerRegion />
			<AppRoutes />
			<PortalsWrapper />
		</MeteorProvider>
	</Suspense>
);

export default AppRoot;
