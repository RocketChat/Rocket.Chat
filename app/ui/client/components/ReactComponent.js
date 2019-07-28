import { Template } from 'meteor/templating';
import React from 'react';
import ReactDOM from 'react-dom';

import './ReactComponent.html';

Template.ReactComponent.onRendered(() => {
	Template.instance().autorun((computation) => {
		if (computation.firstRun) {
			Template.instance().container = Template.instance().firstNode;
		}

		const { Component, ...props } = Template.currentData();
		ReactDOM.render(<Component {...props} />, Template.instance().firstNode);
	});
});

Template.ReactComponent.onDestroyed(() => {
	if (Template.instance().container) {
		ReactDOM.unmountComponentAtNode(Template.instance().container);
	}
});
