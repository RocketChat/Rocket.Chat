import type { MutableRefObject, ReactElement, ReactNode } from 'react';
import React, { useCallback, useRef, useState, useMemo } from 'react';
import type { RouteName, RouteParameters, To, SearchParameters, LocationPathname, LocationSearch } from '@rocket.chat/ui-contexts';
import { RouterContext } from '@rocket.chat/ui-contexts';
import { Emitter } from '@rocket.chat/emitter';
import { compile } from 'path-to-regexp';

import type { UpgradeTabVariant } from '../../../lib/upgradeTab';

const useSubscribableState = <T,>(initialState: T | (() => T)) => {
	const [value, setValue] = useState<T>(initialState);

	const emitterRef = useRef(new Emitter<{ update: void }>());

	const get = useCallback(() => value, [value]);

	const set = useCallback((newValue: T | ((prev: T) => T)) => {
		setValue(newValue);
		emitterRef.current.emit('update');
	}, []);

	const subscribe = useMemo(() => emitterRef.current.on.bind(emitterRef.current, 'update'), []);

	return { get, set, subscribe };
};

type RouteTuple = [name: RouteName, parameters?: RouteParameters, queryStringParameters?: SearchParameters];

const encodeSearchParameters = (searchParameters: SearchParameters) => {
	const search = new URLSearchParams();

	for (const [key, value] of Object.entries(searchParameters)) {
		search.append(key, value);
	}

	const searchString = search.toString();

	return searchString ? (`?${searchString}` as `?${LocationSearch}`) : '';
};

const buildRoutePath = (to: To): LocationPathname | `${LocationPathname}?${LocationSearch}` => {
	if (typeof to === 'string') {
		return to;
	}

	if ('pathname' in to) {
		const { pathname, search = {} } = to;
		return (pathname + encodeSearchParameters(search)) as LocationPathname | `${LocationPathname}?${LocationSearch}`;
	}

	if ('pattern' in to) {
		const { pattern, params = {}, search = {} } = to;
		return (compile(pattern, { encode: encodeURIComponent })(params) + encodeSearchParameters(search)) as
			| LocationPathname
			| `${LocationPathname}?${LocationSearch}`;
	}

	if ('name' in to) {
		const { name, params = {}, search = {} } = to;

		switch (name) {
			case 'audit-home':
				return `/audit${encodeSearchParameters(search)}`;

			case 'audit-log':
				return `/audit-log${encodeSearchParameters(search)}`;

			case 'marketplace':
				return `/marketplace/${params.context}/${params.page}${encodeSearchParameters(search)}`;

			case 'upgrade':
				return `/admin/upgrade/${params.type as UpgradeTabVariant}${encodeSearchParameters(search)}`;
		}

		return (compile(name, { encode: encodeURIComponent })(params) + encodeSearchParameters(search)) as
			| LocationPathname
			| `${LocationPathname}?${LocationSearch}`;
	}

	throw new Error('Invalid route');
};

const buildRouteTuple = (to: To): RouteTuple => {
	if (typeof to === 'string') {
		return ['home', undefined, undefined];
	}

	if ('pathname' in to) {
		const { search = {} } = to;
		return ['home', undefined, search];
	}

	if ('pattern' in to) {
		const { params = {}, search = {} } = to;
		return ['home', params, search];
	}

	if ('name' in to) {
		const { name, params = {}, search = {} } = to;
		return [name, params, search];
	}

	throw new Error('Invalid route');
};

type RouterContextMockProps = {
	children?: ReactNode;
	navigate?: (toOrDelta: number | To) => void;
	currentPath?: MutableRefObject<string | undefined>;
};

const RouterContextMock = ({ children, navigate, currentPath }: RouterContextMockProps): ReactElement => {
	const currentRoute = useSubscribableState<RouteTuple>(['home', undefined, undefined]);
	const history = useRef<{ stack: To[]; index: number }>({ stack: ['/'], index: 0 });

	if (currentPath) {
		currentPath.current = buildRoutePath(history.current.stack[history.current.index]);
	}

	return (
		<RouterContext.Provider
			value={useMemo(() => {
				const subscribeToCurrentRoute = currentRoute.subscribe;
				const getCurrentRoute = currentRoute.get;
				const setCurrentRoute = currentRoute.set;

				return {
					subscribeToRouteChange: () => () => undefined,
					getLocationPathname: () => '/',
					getLocationSearch: () => '',
					getRouteParameters: () => ({}),
					getSearchParameters: () => ({}),
					getRouteName: () => 'home',
					buildRoutePath,
					navigate:
						navigate ??
						((toOrDelta: number | To) => {
							if (typeof toOrDelta === 'number') {
								history.current.index += toOrDelta;

								if (history.current.index < 0) {
									history.current.index = 0;
								}

								if (history.current.index >= history.current.stack.length) {
									history.current.index = history.current.stack.length - 1;
								}

								setCurrentRoute(buildRouteTuple(history.current.stack[history.current.index]));
								return;
							}

							history.current.stack = history.current.stack.slice(0, history.current.index + 1);
							history.current.stack.push(toOrDelta);
							history.current.index = history.current.stack.length - 1;

							setCurrentRoute(buildRouteTuple(toOrDelta));
						}),
					queryCurrentRoute: () => [subscribeToCurrentRoute, getCurrentRoute],
				};
			}, [currentRoute.get, currentRoute.set, currentRoute.subscribe, navigate])}
		>
			{children}
		</RouterContext.Provider>
	);
};

export default RouterContextMock;
