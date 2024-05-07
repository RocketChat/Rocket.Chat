import React, { StrictMode } from 'react';
import { render } from 'react-dom';

import AppRoot from '../views/root/AppRoot';

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
	<StrictMode>
		<AppRoot />
	</StrictMode>,
	container,
);
