import { FlowRouter } from 'meteor/kadira:flow-router';
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

const getRouteParameter = createObservableFromReactive((name) => FlowRouter.getParam(name));
const getQueryStringParameter = createObservableFromReactive((name) => FlowRouter.getQueryParam(name));

const contextValue = {
	navigateTo,
	replaceWith,
	getRouteParameter,
	getQueryStringParameter,
};

export function RouterProvider({ children }) {
	return <RouterContext.Provider children={children} value={contextValue} />;
}
