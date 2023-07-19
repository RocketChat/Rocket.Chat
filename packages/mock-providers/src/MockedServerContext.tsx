import React from 'react';
import type { Serialized } from '@rocket.chat/core-typings';
import type { Method, OperationParams, OperationResult, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import type {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	StreamKeys,
	StreamNames,
	StreamerCallbackArgs,
} from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Emitter } from '@rocket.chat/emitter';

export const MockedServerContext = ({
	emitter,
	handleRequest,
	handleMethod,
	children,
}: {
	emitter?: Emitter;
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
						return handleRequest?.(args);
					},
					getStream:
						<N extends StreamNames, K extends StreamKeys<N>>(
							streamName: N,
							_options?: {
								retransmit?: boolean | undefined;
								retransmitToSelf?: boolean | undefined;
							},
						) =>
						(eventName: K, callback: (...args: StreamerCallbackArgs<N, K>) => void) =>
							emitter?.on(`${streamName}/${eventName}`, ((args: any[]) => callback(...(args as any))) as any),
				} as any
			}
		>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</ServerContext.Provider>
	);
};
