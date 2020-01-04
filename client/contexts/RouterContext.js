import { createContext, useContext, useMemo, useCallback } from 'react';

import { useObservableValue } from '../hooks/useObservableValue';

export const RouterContext = createContext({
	navigateTo: () => {},
	replaceWith: () => {},
	getRouteParameter: () => {},
	getQueryStringParameter: () => {},
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
	const { getRouteParameter } = useContext(RouterContext);
	return useObservableValue(useCallback((listener) => getRouteParameter(name, listener), [name]));
};

export const useQueryStringParameter = (name) => {
	const { getQueryStringParameter } = useContext(RouterContext);
	return useObservableValue(useCallback((listener) => getQueryStringParameter(name, listener), [name]));
};
