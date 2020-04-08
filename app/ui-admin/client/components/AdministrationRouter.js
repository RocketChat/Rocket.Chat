import React, { lazy, useMemo, Suspense } from 'react';

import { useAdminSideNav } from '../hooks/useAdminSideNav';
import PageSkeleton from './PageSkeleton';

function AdministrationRouter({ lazyRouteComponent }) {
	useAdminSideNav();

	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);

	return <Suspense fallback={<PageSkeleton />}>
		<LazyRouteComponent />
	</Suspense>;
}

export default AdministrationRouter;
