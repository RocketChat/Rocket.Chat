import React, { lazy, Suspense } from 'react';
import { render } from 'react-dom';

const createContainer = (): Element => {
	const container = document.getElementById('react-root') ?? document.createElement('div');
	container.id = 'react-root';
	Object.assign(container.style, {
		position: 'relative',
		display: 'flex',
		overflow: 'visible',
		flexDirection: 'column',
		width: '100vw',
		height: '100vh',
		padding: '0',
	});
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
