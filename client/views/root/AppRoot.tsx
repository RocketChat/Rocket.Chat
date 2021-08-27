import React, { FC, lazy, Suspense } from 'react';
import { Router } from 'react-router-dom';

import { getFlowRouterHistory } from '../../lib/flowRouterHistory';
import PageLoading from './PageLoading';

const ConnectionStatusBar = lazy(
	() => import('../../components/connectionStatus/ConnectionStatusBar'),
);
const MeteorProvider = lazy(() => import('../../providers/MeteorProvider'));
const BannerRegion = lazy(() => import('../banners/BannerRegion'));
const AppLayout = lazy(() => import('./AppLayout'));
const PortalsWrapper = lazy(() => import('./PortalsWrapper'));

const history = getFlowRouterHistory();

const AppRoot: FC = () => (
	<Suspense fallback={<PageLoading />}>
		<Router history={history}>
			<MeteorProvider>
				<ConnectionStatusBar />
				<BannerRegion />
				<AppLayout />
				<PortalsWrapper />
			</MeteorProvider>
		</Router>
	</Suspense>
);

export default AppRoot;
