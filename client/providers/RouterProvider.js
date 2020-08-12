import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import React from 'react';

import { RouterContext } from '../contexts/RouterContext';

const createSubscription = (getValue) => {
	let currentValue = Tracker.nonreactive(getValue);
	return {
		getCurrentValue: () => currentValue,
		subscribe: (callback) => {
			const computation = Tracker.autorun(() => {
				currentValue = getValue();
				callback();
			});

			return () => {
				computation.stop();
			};
		},
	};
};

const queryRoutePath = (name, parameters, queryStringParameters) =>
	createSubscription(() => FlowRouter.path(name, parameters, queryStringParameters));

const queryRouteUrl = (name, parameters, queryStringParameters) =>
	createSubscription(() => FlowRouter.url(name, parameters, queryStringParameters));

const pushRoute = (name, parameters, queryStringParameters) => {
	FlowRouter.go(name, parameters, queryStringParameters);
};

const replaceRoute = (name, parameters, queryStringParameters) => {
	FlowRouter.withReplaceState(() => {
		FlowRouter.go(name, parameters, queryStringParameters);
	});
};

const queryRouteParameter = (name) =>
	createSubscription(() => FlowRouter.getParam(name));

const queryQueryStringParameter = (name) =>
	createSubscription(() => FlowRouter.getQueryParam(name));

const queryCurrentRoute = () =>
	createSubscription(() => {
		FlowRouter.watchPathChange();
		const {
			route: {
				name,
				group: {
					name: groupName,
				} = {},
			},
			params,
			queryParams,
		} = FlowRouter.current();
		return [name, params, queryParams, groupName];
	});

const contextValue = {
	queryRoutePath,
	queryRouteUrl,
	pushRoute,
	replaceRoute,
	queryRouteParameter,
	queryQueryStringParameter,
	queryCurrentRoute,
};

export function RouterProvider({ children }) {
	return <RouterContext.Provider children={children} value={contextValue} />;
}
