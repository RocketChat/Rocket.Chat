import { Meteor } from 'meteor/meteor';
import React from 'react';
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

Meteor.startup(() => {
	const container = createContainer();
	render(<AppRoot />, container);
});
