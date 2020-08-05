import React, { lazy, useMemo, Suspense, useEffect } from 'react';

import PageSkeleton from '../components/PageSkeleton';
import { SideNav } from '../../app/ui-utils/client';

function OmnichannelRouter({ lazyRouteComponent, ...props }) {
	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);
	useEffect(() => {
		SideNav.setFlex('omnichannelFlex');
		SideNav.openFlex();
	}, []);

	return <Suspense fallback={<PageSkeleton />}>
		<LazyRouteComponent {...props} />
	</Suspense>;
}

export default OmnichannelRouter;
