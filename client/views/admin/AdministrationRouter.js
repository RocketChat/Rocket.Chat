import React, { lazy, useMemo, Suspense, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';
import SettingsProvider from '../../providers/SettingsProvider';
import AdministrationLayout from './AdministrationLayout';

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('admin-info');
	useEffect(() => {
		if (routeName === 'admin-index') {
			defaultRoute.push();
		}
	}, [defaultRoute, routeName]);

	const LazyRouteComponent = useMemo(() => (lazyRouteComponent ? lazy(lazyRouteComponent) : null), [
		lazyRouteComponent,
	]);

	return (
		<AdministrationLayout>
			<SettingsProvider privileged>
				{LazyRouteComponent ? (
					<Suspense fallback={<PageSkeleton />}>
						<LazyRouteComponent {...props} />
					</Suspense>
				) : (
					<PageSkeleton />
				)}
			</SettingsProvider>
		</AdministrationLayout>
	);
}

export default AdministrationRouter;
