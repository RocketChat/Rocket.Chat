import React, { lazy, Suspense } from 'react';
import { render } from 'react-dom';

const createContainer = (): Element => {
	const container = document.getElementById('react-root') ?? document.createElement('div');
	container.id = 'react-root';
	document.body.insertBefore(container, document.body.firstChild);

	return container;
};

const LazyAppRoot = lazy(() => import('../views/root/AppRoot'));

const container = createContainer();
render(
	<Suspense fallback={null}>
		<LazyAppRoot />
	</Suspense>,
	container,
);
