import { Template } from 'meteor/templating';
import React from 'react';
import ReactDOM from 'react-dom';

import './ReactComponent.html';

Template.ReactComponent.onRendered(() => {
	const instance = Template.instance();
	instance.autorun(() => {
		const { Component, ...props } = Template.currentData();
		ReactDOM.render(<Component {...props} />, instance.firstNode);
	}).onStop(() => {
		ReactDOM.unmountComponentAtNode(instance.firstNode);
	});
});
