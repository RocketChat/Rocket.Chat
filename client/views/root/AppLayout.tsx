import React, { FC, Fragment, Suspense } from 'react';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import { blazePortals } from '../../lib/portals/blazePortals';
import PageLoading from './PageLoading';
import { useTooltipHandling } from './useTooltipHandling';

const AppLayout: FC = () => {
	useTooltipHandling();

	const layout = useSubscription(appLayout);
	const portals = useSubscription(blazePortals);

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
