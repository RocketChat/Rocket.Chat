import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import React from 'react';

import { RouterContext } from '../contexts/RouterContext';

const pushRoute = (pathDefinition, parameters, queryStringParameters) => {
	FlowRouter.go(pathDefinition, parameters, queryStringParameters);
};

const replaceRoute = (pathDefinition, parameters, queryStringParameters) => {
	FlowRouter.withReplaceState(() => {
		FlowRouter.go(pathDefinition, parameters, queryStringParameters);
	});
};

const getRoutePath = (pathDefinition, parameters, queryStringParameters) =>
	Tracker.nonreactive(() => FlowRouter.path(pathDefinition, parameters, queryStringParameters));

const subscribeToRoutePath = (pathDefinition, parameters, queryStringParameters, callback) => {
	const computation = Tracker.autorun(() => {
		callback(FlowRouter.path(pathDefinition, parameters, queryStringParameters));
	});

	return () => {
		computation.stop();
	};
};

const getRouteParameter = (name) => Tracker.nonreactive(() => FlowRouter.getParam(name));

const subscribeToRouteParameter = (name, callback) => {
	const computation = Tracker.autorun(() => {
		callback(FlowRouter.getParam(name));
	});

	return () => {
		computation.stop();
	};
};

const getQueryStringParameter = (name) => Tracker.nonreactive(() => FlowRouter.getQueryParam(name));

const subscribeToQueryStringParameter = (name, callback) => {
	const computation = Tracker.autorun(() => {
		callback(FlowRouter.getQueryParam(name));
	});

	return () => {
		computation.stop();
	};
};

const contextValue = {
	getRoutePath,
	subscribeToRoutePath,
	pushRoute,
	replaceRoute,
	getRouteParameter,
	subscribeToRouteParameter,
	getQueryStringParameter,
	subscribeToQueryStringParameter,
};

export function RouterProvider({ children }) {
	return <RouterContext.Provider children={children} value={contextValue} />;
}
