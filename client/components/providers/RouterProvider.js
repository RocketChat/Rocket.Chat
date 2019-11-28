import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const RouterContext = createContext({
	navigateTo: () => {},
	replaceWith: () => {},
	getRouteParameter: () => {},
	watchRouteParameter: () => {},
	getQueryStringParameter: () => {},
	watchQueryStringParameter: () => {},
});

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
	return <RouterContext.Provider value={router}>
		{children}
	</RouterContext.Provider>;
}

export const useRoute = (pathDefinition) => {
	const { navigateTo, replaceWith } = useContext(RouterContext);

	return useMemo(() => {
		const navigate = (...args) => navigateTo(pathDefinition, ...args);
		navigate.replacingState = (...args) => replaceWith(pathDefinition, ...args);
		return navigate;
	}, [navigateTo, replaceWith]);
};

export const useRouteParameter = (name) => {
	const { getRouteParameter, watchRouteParameter } = useContext(RouterContext);
	const [parameter, setParameter] = useState(getRouteParameter(name));

	useEffect(() => watchRouteParameter(name, setParameter), [watchRouteParameter, name]);

	return parameter;
};

export const useQueryStringParameter = (name) => {
	const { getQueryStringParameter, watchQueryStringParameter } = useContext(RouterContext);
	const [parameter, setParameter] = useState(getQueryStringParameter(name));

	useEffect(() => watchQueryStringParameter(name, setParameter), [watchQueryStringParameter, name]);

	return parameter;
};
