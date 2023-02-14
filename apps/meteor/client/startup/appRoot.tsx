import React, { lazy, Suspense } from 'react';
import { render } from 'react-dom';

import AppRoot from '../views/root/AppRoot';
import PageLoading from '../views/root/PageLoading';

const Root = lazy(() => import('../components/root/ErrorBoundary'));
const createContainer = (): Element => {
	const container = document.getElementById('react-root');

	if (!container) {
		throw new Error('could not find the element #react-root on DOM tree');
	}

	document.body.insertBefore(container, document.body.firstChild);

	return container;
};

const container = createContainer();
render(
	(window as any).__BUGSNAG_KEY__ ? (
		<Suspense fallback={<PageLoading />}>
			<Root>
				<AppRoot />
			</Root>
		</Suspense>
	) : (
		<AppRoot />
	),
	container,
);
