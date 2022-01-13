import React, { createElement, FC, Suspense } from 'react';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import PageLoading from './PageLoading';

const AppLayout: FC = () => {
	const descriptor = useSubscription(appLayout);

	if (descriptor === null) {
		return null;
	}

	return <Suspense fallback={<PageLoading />}>{createElement(descriptor.component, descriptor.props)}</Suspense>;
};

export default AppLayout;
