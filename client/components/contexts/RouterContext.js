import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const RouterContext = createContext({
	navigateTo: () => {},
	replaceWith: () => {},
	getRouteParameter: () => {},
	watchRouteParameter: () => {},
	getQueryStringParameter: () => {},
	watchQueryStringParameter: () => {},
});

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
