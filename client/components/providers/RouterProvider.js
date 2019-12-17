import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import React from 'react';

import { RouterContext } from '../../contexts/RouterContext';

const navigateTo = (pathDefinition, parameters, queryStringParameters) => {
	FlowRouter.go(pathDefinition, parameters, queryStringParameters);
};

const replaceWith = (pathDefinition, parameters, queryStringParameters) => {
	FlowRouter.withReplaceState(() => {
		FlowRouter.go(pathDefinition, parameters, queryStringParameters);
	});
};

const getRouteParameter = (name) => Tracker.nonreactive(() => FlowRouter.getParam(name));

const watchRouteParameter = (name, subscriber) => {
	const computation = Tracker.autorun(() => {
		subscriber(FlowRouter.getParam(name));
	});

	return () => computation.stop();
};

const getQueryStringParameter = (name) => Tracker.nonreactive(() => FlowRouter.getQueryParam(name));

const watchQueryStringParameter = (name, subscriber) => {
	const computation = Tracker.autorun(() => {
		subscriber(FlowRouter.getQueryParam(name));
	});

	return () => computation.stop();
};

const router = {
	navigateTo,
	replaceWith,
	getRouteParameter,
	watchRouteParameter,
	getQueryStringParameter,
	watchQueryStringParameter,
};

export function RouterProvider({ children }) {
	return <RouterContext.Provider children={children} value={router} />;
}
