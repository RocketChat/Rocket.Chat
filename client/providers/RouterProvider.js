import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import React from 'react';

import { RouterContext } from '../contexts/RouterContext';

const pushRoute = (name, parameters, queryStringParameters) => {
	FlowRouter.go(name, parameters, queryStringParameters);
};

const replaceRoute = (name, parameters, queryStringParameters) => {
	FlowRouter.withReplaceState(() => {
		FlowRouter.go(name, parameters, queryStringParameters);
	});
};

const getRoutePath = (name, parameters, queryStringParameters) =>
	Tracker.nonreactive(() => FlowRouter.path(name, parameters, queryStringParameters));

const subscribeToRoutePath = (name, parameters, queryStringParameters, callback) => {
	const computation = Tracker.autorun(() => {
		callback(FlowRouter.path(name, parameters, queryStringParameters));
	});

	return () => {
		computation.stop();
	};
};

const getRouteUrl = (name, parameters, queryStringParameters) =>
	Tracker.nonreactive(() => FlowRouter.url(name, parameters, queryStringParameters));

const subscribeToRouteUrl = (name, parameters, queryStringParameters, callback) => {
	const computation = Tracker.autorun(() => {
		callback(FlowRouter.url(name, parameters, queryStringParameters));
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

const getCurrentRoute = () => Tracker.nonreactive(() => {
	const { route: { name }, params, queryParams } = FlowRouter.current();
	return [name, params, queryParams];
});

const subscribeToCurrentRoute = (callback) => {
	const computation = Tracker.autorun(() => {
		FlowRouter.watchPathChange();
		const { route: { name }, params, queryParams } = FlowRouter.current();
		callback([name, params, queryParams]);
	});

	return () => {
		computation.stop();
	};
};

const contextValue = {
	getRoutePath,
	subscribeToRoutePath,
	getRouteUrl,
	subscribeToRouteUrl,
	pushRoute,
	replaceRoute,
	getRouteParameter,
	subscribeToRouteParameter,
	getQueryStringParameter,
	subscribeToQueryStringParameter,
	getCurrentRoute,
	subscribeToCurrentRoute,
};

export function RouterProvider({ children }) {
	return <RouterContext.Provider children={children} value={contextValue} />;
}
