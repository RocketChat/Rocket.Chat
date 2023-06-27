import type { RouterContextValue, RouterPathPattern, RouterPathName, RouterPathname } from '@rocket.chat/ui-contexts';
import { RouterContext } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { match } from 'path-to-regexp';
import type { FC } from 'react';
import React from 'react';

import { createSubscription } from '../lib/createSubscription';
import { queueMicrotask } from '../lib/utils/queueMicrotask';

const getRoutePath = (
	patternOrName: RouterPathPattern | RouterPathName,
	parameters?: Record<string, string>,
	search?: Record<string, string>,
): string => Tracker.nonreactive(() => FlowRouter.path(patternOrName, parameters, search));

const navigate = (
	toOrDelta:
		| string
		| {
				pathname?: string;
				search?: string;
				hash?: string;
		  }
		| {
				pathname: string;
				search?: Record<string, string>;
				hash?: undefined;
		  }
		| {
				pattern: string;
				params: Record<string, string>;
				search?: Record<string, string>;
		  }
		| number,
	options?: {
		replace?: boolean;
	},
) => {
	if (typeof toOrDelta === 'number') {
		window.history.go(toOrDelta);
		return;
	}

	if (typeof toOrDelta === 'string') {
		navigate({ pathname: toOrDelta }, options);
		return;
	}

	if ('pattern' in toOrDelta) {
		const { pattern, params, search } = toOrDelta;
		const { replace } = options || {};
		const fn = () => FlowRouter.go(pattern, params, search);

		if (replace) {
			FlowRouter.withReplaceState(fn);
		} else {
			fn();
		}

		return;
	}

	if ('pathname' in toOrDelta && toOrDelta.pathname !== undefined && typeof toOrDelta.search === 'object') {
		const { pathname, search } = toOrDelta;
		const { replace } = options || {};
		const fn = () => FlowRouter.go(pathname, undefined, search);

		if (replace) {
			FlowRouter.withReplaceState(fn);
		} else {
			fn();
		}

		return;
	}

	const { pathname = FlowRouter.current().path, search = '', hash = '' } = toOrDelta;
	const { replace } = options || {};

	const fn = () => {
		FlowRouter.go(pathname + search + hash);
	};

	if (replace) {
		FlowRouter.withReplaceState(fn);
		return;
	}

	fn();
};

const subscribers = new Set<() => void>();

const listenToRouteChange = (): void => {
	FlowRouter.watchPathChange();
	subscribers.forEach((onRouteChange) => onRouteChange());
};

let computation: Tracker.Computation | undefined;

queueMicrotask(() => {
	computation = Tracker.autorun(listenToRouteChange);
});

const subscribeToRouteChange = (onRouteChange: () => void): (() => void) => {
	subscribers.add(onRouteChange);

	onRouteChange();

	return () => {
		subscribers.delete(onRouteChange);

		if (subscribers.size === 0) {
			queueMicrotask(() => computation?.stop());
		}
	};
};

const getPathname = () => FlowRouter.current().path as RouterPathname;

const getParameters = () => FlowRouter.current().params;

const getSearch = () => location.search;

const getSearchParameters = () => FlowRouter.current().queryParams ?? {};

const matchPath = <TPathPattern extends RouterPathPattern>(pattern: TPathPattern | string, pathname: string) => {
	const result = match<Record<string, string>>(pattern, { decode: decodeURIComponent })(pathname);

	if (!result) {
		return null;
	}

	return {
		pattern: pattern as TPathPattern,
		pathname: result.path,
		params: result.params,
	};
};

const getRoutePatternByName = (name: RouterPathName) => FlowRouter._routesMap[name]?.pathDef ?? '/';

const queryRoutePath = (
	name: Parameters<RouterContextValue['queryRoutePath']>[0],
	parameters: Parameters<RouterContextValue['queryRoutePath']>[1],
	queryStringParameters: Parameters<RouterContextValue['queryRoutePath']>[2],
): ReturnType<RouterContextValue['queryRoutePath']> => createSubscription(() => FlowRouter.path(name, parameters, queryStringParameters));

const pushRoute = (
	name: Parameters<RouterContextValue['pushRoute']>[0],
	parameters: Parameters<RouterContextValue['pushRoute']>[1],
	queryStringParameters?: ((prev: Record<string, string>) => Record<string, string>) | Record<string, string>,
): ReturnType<RouterContextValue['pushRoute']> => {
	const queryParams = typeof queryStringParameters === 'function' ? queryStringParameters(getSearchParameters()) : queryStringParameters;
	navigate({
		pattern: name,
		params: parameters ?? {},
		search: queryParams,
	});
};

const replaceRoute = (
	name: Parameters<RouterContextValue['replaceRoute']>[0],
	parameters: Parameters<RouterContextValue['replaceRoute']>[1],
	queryStringParameters?: ((prev: Record<string, string>) => Record<string, string>) | Record<string, string>,
): ReturnType<RouterContextValue['replaceRoute']> => {
	const queryParams = typeof queryStringParameters === 'function' ? queryStringParameters(getSearchParameters()) : queryStringParameters;
	navigate(
		{
			pattern: name,
			params: parameters ?? {},
			search: queryParams,
		},
		{ replace: true },
	);
};

const queryCurrentRoute = (): ReturnType<RouterContextValue['queryCurrentRoute']> =>
	createSubscription(() => {
		FlowRouter.watchPathChange();
		const { route, params, queryParams } = FlowRouter.current();
		return [route?.name, params, queryParams, route?.group?.name];
	});

export const router: RouterContextValue = {
	subscribeToRouteChange,
	getPathname,
	getParameters,
	getSearch,
	getSearchParameters,
	matchPath,
	getRoutePatternByName,
	getRoutePath,
	navigate,
	queryRoutePath,
	pushRoute,
	replaceRoute,
	queryCurrentRoute,
};

const RouterProvider: FC = ({ children }) => <RouterContext.Provider children={children} value={router} />;

export default RouterProvider;
