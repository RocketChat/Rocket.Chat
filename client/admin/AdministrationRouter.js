import React, { lazy, useMemo, Suspense } from 'react';

import AdministrationLayout from './AdministrationLayout';
import PrivilegedSettingsProvider from './PrivilegedSettingsProvider';
import PageSkeleton from './PageSkeleton';

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);

	return <PrivilegedSettingsProvider>
		<AdministrationLayout>
			<Suspense fallback={<PageSkeleton />}>
				<LazyRouteComponent {...props} />
			</Suspense>
		</AdministrationLayout>
	</PrivilegedSettingsProvider>;
}

export default AdministrationRouter;
