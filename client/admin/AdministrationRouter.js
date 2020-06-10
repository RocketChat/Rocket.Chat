import React, { lazy, useMemo, Suspense, useEffect } from 'react';

import { SideNav } from '../../app/ui-utils/client';
import PageSkeleton from './PageSkeleton';
import { createTemplateForComponent } from '../reactAdapters';
import PrivilegedSettingsProvider from './PrivilegedSettingsProvider';

createTemplateForComponent('adminFlex', () => import('./sidebar/AdminSidebar'));

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	useEffect(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}, []);

	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);

	return <PrivilegedSettingsProvider>
		<Suspense fallback={<PageSkeleton />}>
			<LazyRouteComponent {...props} />
		</Suspense>
	</PrivilegedSettingsProvider>;
}

export default AdministrationRouter;
