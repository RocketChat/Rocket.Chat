import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { lazy, Suspense } from 'react';

import { queryClient } from '../../lib/queryClient';
import OutermostErrorBoundary from './OutermostErrorBoundary';
import PageLoading from './PageLoading';

const MeteorProvider = lazy(() => import('../../providers/MeteorProvider'));
const AppLayout = lazy(() => import('./AppLayout'));

const AppRoot = (): ReactElement => (
	<OutermostErrorBoundary>
		<Suspense fallback={<PageLoading />}>
			<QueryClientProvider client={queryClient}>
				<MeteorProvider>
					<AppLayout />
				</MeteorProvider>
			</QueryClientProvider>
		</Suspense>
	</OutermostErrorBoundary>
);

export default AppRoot;
