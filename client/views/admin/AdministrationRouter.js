import React, { lazy, useMemo, Suspense } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import SettingsProvider from '../../providers/SettingsProvider';
import AdministrationLayout from './AdministrationLayout';

function AdministrationRouter({ lazyRouteComponent, ...props }) {
	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);
	return (
		<AdministrationLayout>
			<SettingsProvider privileged>
				<Suspense fallback={<PageSkeleton />}>
					<LazyRouteComponent {...props} />
				</Suspense>
			</SettingsProvider>
		</AdministrationLayout>
	);
}

export default AdministrationRouter;
