import type { ReactElement, ReactNode } from 'react';
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

type RouteTuple = [name: string, parameters?: Record<string, string>, queryStringParameters?: Record<string, string>];

type RouterContextMockProps = {
	children?: ReactNode;
	initialRoute?: RouteTuple;
	pushRoute?: (...args: RouteTuple) => void;
	replaceRoute?: (...args: RouteTuple) => void;
};

const RouterContextMock = ({ children, initialRoute, pushRoute, replaceRoute }: RouterContextMockProps): ReactElement => {
	const currentRoute = useSubscribableState(initialRoute ?? (['home'] as RouteTuple));

	return (
		<RouterContext.Provider
			value={useMemo(() => {
				const subscribeToCurrentRoute = currentRoute.subscribe;
				const getCurrentRoute = currentRoute.get;
				const setCurrentRoute = currentRoute.set;

				return {
					queryRoutePath: () => [() => (): void => undefined, (): undefined => undefined],
					queryRouteUrl: () => [() => (): void => undefined, (): undefined => undefined],
					pushRoute: (...args) => {
						setCurrentRoute(args);
						pushRoute?.(...args);
					},
					replaceRoute: (...args) => {
						setCurrentRoute(args);
						replaceRoute?.(...args);
					},
					queryRouteParameter: () => [() => (): void => undefined, (): undefined => undefined],
					queryQueryStringParameter: () => [() => (): void => undefined, (): undefined => undefined],
					queryCurrentRoute: () => [subscribeToCurrentRoute, getCurrentRoute],
				};
			}, [currentRoute.get, currentRoute.set, currentRoute.subscribe, pushRoute, replaceRoute])}
		>
			{children}
		</RouterContext.Provider>
	);
};

export default RouterContextMock;
