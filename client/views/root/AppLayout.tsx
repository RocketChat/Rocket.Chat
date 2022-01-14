import React, { createElement, FC, Fragment, Suspense } from 'react';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import { blazePortals } from '../../lib/portals/blazePortals';
import PageLoading from './PageLoading';

const AppLayout: FC = () => {
	const descriptor = useSubscription(appLayout);
	const portals = useSubscription(blazePortals);

	if (descriptor === null) {
		return null;
	}

	return (
		<>
			<Suspense fallback={<PageLoading />}>{createElement(descriptor.component, descriptor.props)}</Suspense>
			{portals.map(({ key, node }) => (
				<Fragment key={key} children={node} />
			))}
		</>
	);
};

export default AppLayout;
