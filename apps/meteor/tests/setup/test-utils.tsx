import type { ReactElement } from 'react';
import React, { lazy, Suspense } from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import OutermostErrorBoundary from '../../client/views/root/OutermostErrorBoundary';
import { queryClient } from '../../client/lib/queryClient';
import PageLoading from '../../client/views/root/PageLoading';

const MeteorProvider = lazy(() => import('../../client/providers/MeteorProvider'));

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<OutermostErrorBoundary>
			<Suspense fallback={<PageLoading />}>
				<QueryClientProvider client={queryClient}>
					<MeteorProvider>{children}</MeteorProvider>
				</QueryClientProvider>
			</Suspense>
		</OutermostErrorBoundary>
	);
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
