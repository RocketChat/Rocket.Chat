import type { Serialized } from '@rocket.chat/core-typings';
import type { Method, OperationParams, OperationResult, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import type { ServerMethodName, ServerMethodParameters, ServerMethodReturn } from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

export const MockedServerContext = ({
	handleRequest,
	handleMethod,
	children,

	isEnterprise,
}: {
	handleRequest?: <TMethod extends Method, TPathPattern extends PathPattern>(args: {
		method: TMethod;
		pathPattern: TPathPattern;
		keys: UrlParams<TPathPattern>;
		params: OperationParams<TMethod, TPathPattern>;
	}) => Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;
	handleMethod?: <MethodName extends ServerMethodName>(
		methodName: MethodName,
		...args: ServerMethodParameters<MethodName>
	) => Promise<ServerMethodReturn<MethodName>>;
	children: React.ReactNode;

	isEnterprise?: boolean;
}): any => {
	const [queryClient] = React.useState(() => new QueryClient());
	return (
		<ServerContext.Provider
			value={
				{
					absoluteUrl: (path: string) => `http://localhost:3000/${path}`,
					callMethod: <MethodName extends ServerMethodName>(methodName: MethodName, ...args: ServerMethodParameters<MethodName>) => {
						return handleMethod?.(methodName, ...args);
					},
					callEndpoint: async <TMethod extends Method, TPathPattern extends PathPattern>(args: {
						method: TMethod;
						pathPattern: TPathPattern;
						keys: UrlParams<TPathPattern>;
						params: OperationParams<TMethod, TPathPattern>;
					}) => {
						if (isEnterprise !== undefined) {
							if (args.method === 'GET' && args.pathPattern === '/v1/licenses.isEnterprise') {
								return {
									isEnterprise,
								} as any;
							}
						}

						return handleRequest?.(args);
					},
					getStream: () => () => undefined,
				} as any
			}
		>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</ServerContext.Provider>
	);
};
