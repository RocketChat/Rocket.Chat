import React, { ContextType, ReactElement, ReactNode, useMemo } from 'react';
import { Subscription } from 'use-subscription';
import { RouterContext } from '@rocket.chat/ui-contexts';

type RouterContextMockProps = {
	children?: ReactNode;
	pushRoute?: (name: string, parameters?: Record<string, string>, queryStringParameters?: Record<string, string>) => void;
	replaceRoute?: (name: string, parameters?: Record<string, string>, queryStringParameters?: Record<string, string>) => void;
};

const RouterContextMock = ({ children, pushRoute, replaceRoute }: RouterContextMockProps): ReactElement => {
	const value = useMemo<ContextType<typeof RouterContext>>(
		() => ({
			queryRoutePath: (): Subscription<undefined> => ({
				getCurrentValue: (): undefined => undefined,
				subscribe: () => (): void => undefined,
			}),
			queryRouteUrl: (): Subscription<undefined> => ({
				getCurrentValue: (): undefined => undefined,
				subscribe: () => (): void => undefined,
			}),
			pushRoute: pushRoute ?? ((): void => undefined),
			replaceRoute: replaceRoute ?? ((): void => undefined),
			queryRouteParameter: (): Subscription<undefined> => ({
				getCurrentValue: (): undefined => undefined,
				subscribe: () => (): void => undefined,
			}),
			queryQueryStringParameter: (): Subscription<undefined> => ({
				getCurrentValue: (): undefined => undefined,
				subscribe: () => (): void => undefined,
			}),
			queryCurrentRoute: (): Subscription<[undefined, {}, {}, undefined]> => ({
				getCurrentValue: (): [undefined, {}, {}, undefined] => [undefined, {}, {}, undefined],
				subscribe: () => (): void => undefined,
			}),
		}),
		[pushRoute, replaceRoute],
	);

	return <RouterContext.Provider children={children} value={value} />;
};

export default RouterContextMock;
