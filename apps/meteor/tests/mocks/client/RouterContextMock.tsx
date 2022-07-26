import React, { ContextType, ReactElement, ReactNode, useMemo } from 'react';
import { RouterContext } from '@rocket.chat/ui-contexts';

type RouterContextMockProps = {
	children?: ReactNode;
	pushRoute?: (name: string, parameters?: Record<string, string>, queryStringParameters?: Record<string, string>) => void;
	replaceRoute?: (name: string, parameters?: Record<string, string>, queryStringParameters?: Record<string, string>) => void;
};

const RouterContextMock = ({ children, pushRoute, replaceRoute }: RouterContextMockProps): ReactElement => {
	const value = useMemo<ContextType<typeof RouterContext>>(
		() => ({
			queryRoutePath: (): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => undefined] => [
				() => (): void => undefined,
				(): undefined => undefined,
			],
			queryRouteUrl: (): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => undefined] => [
				() => (): void => undefined,
				(): undefined => undefined,
			],
			pushRoute: pushRoute ?? ((): void => undefined),
			replaceRoute: replaceRoute ?? ((): void => undefined),
			queryRouteParameter: (): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => undefined] => [
				() => (): void => undefined,
				(): undefined => undefined,
			],
			queryQueryStringParameter: (): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => undefined] => [
				() => (): void => undefined,
				(): undefined => undefined,
			],
			queryCurrentRoute: (): [
				subscribe: (onStoreChange: () => void) => () => void,
				getSnapshot: () => [undefined?, {}?, {}?, undefined?],
			] => [() => (): void => undefined, (): [undefined, {}, {}, undefined] => [undefined, {}, {}, undefined]],
		}),
		[pushRoute, replaceRoute],
	);

	return <RouterContext.Provider children={children} value={value} />;
};

export default RouterContextMock;
