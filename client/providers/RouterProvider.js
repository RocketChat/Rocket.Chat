import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import React from 'react';

import { RouterContext } from '../contexts/RouterContext';
import { createObservableFromReactive } from './createObservableFromReactive';

const navigateTo = (pathDefinition, parameters, queryStringParameters) => {
	FlowRouter.go(pathDefinition, parameters, queryStringParameters);
};

const replaceWith = (pathDefinition, parameters, queryStringParameters) => {
	FlowRouter.withReplaceState(() => {
		FlowRouter.go(pathDefinition, parameters, queryStringParameters);
	});
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
	navigateTo,
	replaceWith,
	getRouteParameter,
	subscribeToRouteParameter,
	getQueryStringParameter,
	subscribeToQueryStringParameter,
};

export function RouterProvider({ children }) {
	return <RouterContext.Provider children={children} value={contextValue} />;
}
