import type { ContextType, ReactElement, ReactNode } from 'react';
import React, { useCallback, useRef, useState, useMemo } from 'react';
import { RouterContext } from '@rocket.chat/ui-contexts';
import { Emitter } from '@rocket.chat/emitter';

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

type RouteTuple = [
	name: Parameters<ContextType<typeof RouterContext>['pushRoute']>[0],
	parameters: Parameters<ContextType<typeof RouterContext>['pushRoute']>[1],
	queryStringParameters?: Record<string, string>,
];

type RouterContextMockProps = {
	children?: ReactNode;
	initialRoute?: RouteTuple;
	navigate?: (
		toOrDelta:
			| string
			| number
			| { pathname?: string; search?: string; hash?: string }
			| { pattern: string; params: Record<string, string>; search?: Record<string, string> }
			| { pathname: string; search?: Record<string, string> },
	) => void;
	pushRoute?: (...args: RouteTuple) => void;
	replaceRoute?: (...args: RouteTuple) => void;
};

const RouterContextMock = ({ children, initialRoute, navigate, pushRoute, replaceRoute }: RouterContextMockProps): ReactElement => {
	const currentRoute = useSubscribableState(initialRoute ?? (['home', undefined, undefined] as RouteTuple));

	return (
		<RouterContext.Provider
			value={useMemo(() => {
				const subscribeToCurrentRoute = currentRoute.subscribe;
				const getCurrentRoute = currentRoute.get;
				const setCurrentRoute = currentRoute.set;

				return {
					queryRoutePath: () => [() => (): void => undefined, (): undefined => undefined],
					queryRouteUrl: () => [() => (): void => undefined, (): undefined => undefined],
					navigate: navigate ?? (() => undefined),
					pushRoute: (name, parameters, queryStringParameters) => {
						const queryParams = typeof queryStringParameters === 'function' ? queryStringParameters({}) : queryStringParameters;
						setCurrentRoute([name, parameters, queryParams]);
						pushRoute?.(name, parameters, queryParams);
					},
					replaceRoute: (name, parameters, queryStringParameters) => {
						const queryParams = typeof queryStringParameters === 'function' ? queryStringParameters({}) : queryStringParameters;
						setCurrentRoute([name, parameters, queryParams]);
						replaceRoute?.(name, parameters, queryParams);
					},
					queryRouteParameter: () => [() => (): void => undefined, (): undefined => undefined],
					queryQueryStringParameter: () => [() => (): void => undefined, (): undefined => undefined],
					queryCurrentRoute: () => [subscribeToCurrentRoute, getCurrentRoute],
					setQueryString: () => undefined,
					getRoutePath: () => '/',
				};
			}, [currentRoute.get, currentRoute.set, currentRoute.subscribe, navigate, pushRoute, replaceRoute])}
		>
			{children}
		</RouterContext.Provider>
	);
};

export default RouterContextMock;
