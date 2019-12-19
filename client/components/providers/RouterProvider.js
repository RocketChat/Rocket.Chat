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

const getRouteParameter = (name, listener) => {
	if (!listener) {
		return Tracker.nonreactive(() => FlowRouter.getParam(name));
	}

	const computation = Tracker.autorun(({ firstRun }) => {
		const value = FlowRouter.getParam(name);
		if (!firstRun) {
			listener(value);
		}
	});

	return () => {
		computation.stop();
	};
};

const getQueryStringParameter = (name, listener) => {
	if (!listener) {
		return Tracker.nonreactive(() => FlowRouter.getQueryParam(name));
	}

	const computation = Tracker.autorun(({ firstRun }) => {
		const value = FlowRouter.getQueryParam(name);
		if (!firstRun) {
			listener(value);
		}
	});

	return () => {
		computation.stop();
	};
};

const contextValue = {
	navigateTo,
	replaceWith,
	getRouteParameter,
	getQueryStringParameter,
};

export function RouterProvider({ children }) {
	return <RouterContext.Provider children={children} value={contextValue} />;
}
