import type { Serialized } from '@rocket.chat/core-typings';
import type { ServerMethodName, ServerMethodParameters, ServerMethodReturn } from '@rocket.chat/ddp-client';
import type { Method, OperationParams, OperationResult, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

export const MockedServerContext = ({
	handleRequest,
	handleMethod,
	children,
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
	children: ReactNode;

	isEnterprise?: boolean;
}): any => {
	const [queryClient] = useState(() => new QueryClient());
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
