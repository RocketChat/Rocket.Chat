import React, { lazy, useMemo, Suspense, useEffect } from 'react';

import { SideNav } from '../../app/ui-utils/client';
import PageSkeleton from './PageSkeleton';
import { createTemplateForComponent } from '../reactAdapters';

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	useEffect(() => {
		const templateName = createTemplateForComponent('AdminSidebar', () => import('./sidebar/AdminSidebar'));
		SideNav.setFlex(templateName);
		SideNav.openFlex();
	}, []);

	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);

	return <Suspense fallback={<PageSkeleton />}>
		<LazyRouteComponent {...props} />
	</Suspense>;
}

export default AdministrationRouter;
