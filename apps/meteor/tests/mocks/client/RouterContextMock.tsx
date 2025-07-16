import type { To, SearchParameters, LocationPathname, LocationSearch } from '@rocket.chat/ui-contexts';
import { RouterContext } from '@rocket.chat/ui-contexts';
import { compile } from 'path-to-regexp';
import { useRef, useMemo } from 'react';
import type { MutableRefObject, ReactElement, ReactNode } from 'react';

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
		}

		return (compile(name, { encode: encodeURIComponent })(params) + encodeSearchParameters(search)) as
			| LocationPathname
			| `${LocationPathname}?${LocationSearch}`;
	}

	throw new Error('Invalid route');
};

type RouterContextMockProps = {
	children?: ReactNode;
	navigate?: (toOrDelta: number | To) => void;
	currentPath?: MutableRefObject<string | undefined>;
	searchParameters?: Record<string, any>;
	routeParameters?: Record<string, any>;
};

const RouterContextMock = ({
	children,
	navigate,
	currentPath,
	searchParameters = {},
	routeParameters = {},
}: RouterContextMockProps): ReactElement => {
	const history = useRef<{ stack: To[]; index: number }>({ stack: ['/'], index: 0 });

	if (currentPath) {
		currentPath.current = buildRoutePath(history.current.stack[history.current.index]);
	}

	return (
		<RouterContext.Provider
			value={useMemo(() => {
				return {
					subscribeToRouteChange: () => () => undefined,
					getLocationPathname: () => '/',
					getLocationSearch: () => '',
					getRouteParameters: () => routeParameters,
					getSearchParameters: () => searchParameters,
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

								return;
							}

							history.current.stack = history.current.stack.slice(0, history.current.index + 1);
							history.current.stack.push(toOrDelta);
							history.current.index = history.current.stack.length - 1;

							if (currentPath) {
								currentPath.current = buildRoutePath(history.current.stack[history.current.index]);
							}
						}),
					defineRoutes: () => () => undefined,
					getRoutes: () => [],
					subscribeToRoutesChange: () => () => undefined,
					getRoomRoute: () => ({ path: '/' }),
				};
			}, [currentPath, navigate])}
		>
			{children}
		</RouterContext.Provider>
	);
};

export default RouterContextMock;
