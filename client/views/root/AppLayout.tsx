import React, { createElement, FC, Fragment, Suspense } from 'react';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import { blazePortals } from '../../lib/portals/blazePortals';
import BlazeTemplate from './BlazeTemplate';
import PageLoading from './PageLoading';

const AppLayout: FC = () => {
	const descriptor = useSubscription(appLayout);
	const portals = useSubscription(blazePortals);

	if (descriptor === null) {
		return null;
	}

	if ('template' in descriptor) {
		return (
			<>
				<BlazeTemplate template={descriptor.template} data={descriptor.data} />
				{portals.map(({ key, node }) => (
					<Fragment key={key} children={node} />
				))}
			</>
		);
	}

	if ('component' in descriptor) {
		return (
			<Suspense fallback={<PageLoading />}>
				{createElement(descriptor.component, descriptor.props)}
			</Suspense>
		);
	}

	throw new Error('invalid app layout descriptor');
};

export default AppLayout;
