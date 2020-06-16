import React, { lazy, useMemo, Suspense } from 'react';

import AdministrationLayout from './AdministrationLayout';
import PrivilegedSettingsProvider from './PrivilegedSettingsProvider';
import PageSkeleton from './PageSkeleton';

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);
	return <AdministrationLayout>
		<PrivilegedSettingsProvider>
			<Suspense fallback={<PageSkeleton />}>
				<LazyRouteComponent {...props} />
			</Suspense>
		</PrivilegedSettingsProvider>
	</AdministrationLayout>;
}

export default AdministrationRouter;
