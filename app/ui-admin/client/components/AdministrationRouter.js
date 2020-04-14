import React, { lazy, useMemo, Suspense } from 'react';

import { useAdminSideNav } from '../hooks/useAdminSideNav';
import PageSkeleton from './PageSkeleton';

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	useAdminSideNav();

	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);

	return <Suspense fallback={<PageSkeleton />}>
		<LazyRouteComponent {...props} />
	</Suspense>;
}

export default AdministrationRouter;
