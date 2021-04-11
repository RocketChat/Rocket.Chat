import React, { createElement, FC, Suspense } from 'react';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import BlazeTemplate from './BlazeTemplate';
import PageLoading from './PageLoading';

const AppLayout: FC = () => {
	const descriptor = useSubscription(appLayout);

	if (descriptor === null) {
		return null;
	}

	if ('template' in descriptor) {
		return <BlazeTemplate template={descriptor.template} data={descriptor.regions ?? {}} />;
	}

	if ('component' in descriptor) {
		return (
			<Suspense fallback={<PageLoading />}>
				{createElement(descriptor.component, descriptor.props)}
			</Suspense>
		);
	}

	throw new Error(`invalid app layout descriptor: ${JSON.stringify(descriptor)}`);
};

export default AppLayout;
