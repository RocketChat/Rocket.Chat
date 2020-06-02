import React, { lazy, useMemo, Suspense, useEffect } from 'react';

import { SideNav } from '../../app/ui-utils/client';
import PageSkeleton from './PageSkeleton';

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	useEffect(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}, []);

	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);

	return <Suspense fallback={<PageSkeleton />}>
		<LazyRouteComponent {...props} />
	</Suspense>;
}

export default AdministrationRouter;
