import type { FC } from 'react';
import React, { Suspense } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { appLayout } from '../../lib/appLayout';
import { blazePortals, useBlazePortals } from '../../lib/portals/blazePortals';
import PageLoading from './PageLoading';

const AppLayout: FC = () => {
	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot);

	const [portals] = useBlazePortals(blazePortals);

	return (
		<>
			<Suspense fallback={<PageLoading />}>{layout}</Suspense>
			{portals}
		</>
	);
};

export default AppLayout;
