import React, { Fragment, ReactElement } from 'react';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import { lazyLayout } from '../../lib/lazyLayout';
import { blazePortals } from '../../lib/portals/blazePortals';
import BlazeTemplate from './BlazeTemplate';

const NotFoundPage = lazyLayout(() => import('../notFound/NotFoundPage'));

const AppLayout = (): ReactElement => {
	const descriptor = useSubscription(appLayout);
	const portals = useSubscription(blazePortals);

	if (descriptor === null) {
		return <NotFoundPage />;
	}

	return (
		<>
			<BlazeTemplate template={descriptor.template} data={descriptor.data} />
			{portals.map(({ key, node }) => (
				<Fragment key={key} children={node} />
			))}
		</>
	);
};

export default AppLayout;
