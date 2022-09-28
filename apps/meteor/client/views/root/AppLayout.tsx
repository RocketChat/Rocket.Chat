import React, { FC, Fragment, Suspense } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { appLayout } from '../../lib/appLayout';
import { blazePortals } from '../../lib/portals/blazePortals';
import { useOpenRoomHandling } from '../room/hooks/useOpenRoomHandling';
import PageLoading from './PageLoading';
import { useTooltipHandling } from './useTooltipHandling';

const AppLayout: FC = () => {
	useTooltipHandling();
	useOpenRoomHandling();

	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot);
	const portals = useSyncExternalStore(blazePortals.subscribe, blazePortals.getSnapshot);

	return (
		<>
			<Suspense fallback={<PageLoading />}>{layout}</Suspense>
			{portals.map(({ key, node }) => (
				<Fragment key={key} children={node} />
			))}
		</>
	);
};

export default AppLayout;
