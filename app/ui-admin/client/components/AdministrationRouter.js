import React, { lazy, useMemo, Suspense } from 'react';

import { useAdminSideNav } from '../hooks/useAdminSideNav';

function AdministrationRouter({ lazyRouteComponent }) {
	useAdminSideNav();

	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);

	return <Suspense fallback={null}>
		<LazyRouteComponent />
	</Suspense>;
}

export default AdministrationRouter;
