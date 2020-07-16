import React, { lazy, useMemo, Suspense } from 'react';

import SettingsProvider from '../providers/SettingsProvider';
import AdministrationLayout from './AdministrationLayout';
import PageSkeleton from './PageSkeleton';

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);
	return <AdministrationLayout>
		<SettingsProvider privileged>
			<Suspense fallback={<PageSkeleton />}>
				<LazyRouteComponent {...props} />
			</Suspense>
		</SettingsProvider>
	</AdministrationLayout>;
}

export default AdministrationRouter;
