import { QueryClientProvider } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { lazy, Suspense } from 'react';

import { queryClient } from '../../lib/queryClient';
import PageLoading from './PageLoading';

const ConnectionStatusBar = lazy(() => import('../../components/connectionStatus/ConnectionStatusBar'));
const MeteorProvider = lazy(() => import('../../providers/MeteorProvider'));
const BannerRegion = lazy(() => import('../banners/BannerRegion'));
const AppLayout = lazy(() => import('./AppLayout'));
const PortalsWrapper = lazy(() => import('./PortalsWrapper'));
const ModalRegion = lazy(() => import('../modal/ModalRegion'));

const AppRoot: FC = () => (
	<Suspense fallback={<PageLoading />}>
		<QueryClientProvider client={queryClient}>
			<MeteorProvider>
				<ConnectionStatusBar />
				<BannerRegion />
				<AppLayout />
				<PortalsWrapper />
				<ModalRegion />
			</MeteorProvider>
		</QueryClientProvider>
	</Suspense>
);

export default AppRoot;
