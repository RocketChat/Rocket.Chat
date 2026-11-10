import type { Serialized } from '@rocket.chat/core-typings';
import type {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	StreamerCallbackArgs,
	StreamerEvents,
	StreamNames,
	StreamKeys,
} from '@rocket.chat/ddp-client';
import type { Method, PathFor, OperationParams, OperationResult, UrlParams, PathPattern } from '@rocket.chat/rest-typings';
import type { UploadResult, ServerContextValue } from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { compile } from 'path-to-regexp';
import type { ReactNode } from 'react';

import { Info as info } from '../../rocketchat.info';
import { sdk } from '../lib/SDKClient';
import { absoluteUrl } from '../lib/absoluteUrl';

const callMethod = <MethodName extends ServerMethodName>(
	methodName: MethodName,
	...args: ServerMethodParameters<MethodName>
): Promise<ServerMethodReturn<MethodName>> => sdk.call(methodName, ...(args as any)) as Promise<ServerMethodReturn<MethodName>>;

const callEndpoint = <TMethod extends Method, TPathPattern extends PathPattern>({
	method,
	pathPattern,
	keys,
	params,
	signal,
	keepalive,
}: {
	method: TMethod;
	pathPattern: TPathPattern;
	keys: UrlParams<TPathPattern>;
	params: OperationParams<TMethod, TPathPattern>;
	signal?: AbortSignal;
	keepalive?: boolean;
}): Promise<Serialized<OperationResult<TMethod, TPathPattern>>> => {
	const compiledPath = compile(pathPattern, { encode: encodeURIComponent })(keys) as any;

	switch (method) {
		case 'GET':
			// oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unnecessary-type-assertion
			return sdk.rest.get(compiledPath, params as any, { signal, keepalive }) as any;

		case 'POST':
			// oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unnecessary-type-assertion
			return sdk.rest.post(compiledPath, params as any, { signal, keepalive }) as any;

		case 'PUT':
			// oxlint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			return sdk.rest.put(compiledPath, params as never, { signal, keepalive }) as never;

		case 'DELETE':
			// oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unnecessary-type-assertion
			return sdk.rest.delete(compiledPath, params as any, { signal, keepalive }) as any;

		default:
			throw new Error('Invalid HTTP method');
	}
};

const uploadToEndpoint = (endpoint: PathFor<'POST'>, formData: any): Promise<UploadResult> => sdk.rest.post(endpoint as any, formData);

const getStream =
	<N extends StreamNames>(
		streamName: N,
		_options?: {
			retransmit?: boolean | undefined;
			retransmitToSelf?: boolean | undefined;
		},
	) =>
	<K extends StreamKeys<N>>(eventName: K, callback: (...args: StreamerCallbackArgs<N, K>) => void): (() => void) =>
		sdk.stream(streamName, [eventName], callback).stop;

const getStreamAll =
	<N extends StreamNames>(streamName: N) =>
	(callback: (eventName: string, args: StreamerEvents[N][number]['args']) => void): (() => void) =>
		sdk.onAnyStreamEvent(streamName, callback).stop;

const writeStream = <N extends StreamNames, K extends StreamKeys<N>>(streamName: N, streamKey: K, ...args: StreamerCallbackArgs<N, K>) =>
	sdk.publish(streamName, [streamKey, ...args]);

export type ServerProviderProps = { children?: ReactNode };

const serverContextValue: ServerContextValue = {
	info,
	absoluteUrl,
	callMethod,
	callEndpoint,
	uploadToEndpoint,
	getStream,
	getStreamAll,
	writeStream,
};

const ServerProvider = ({ children }: ServerProviderProps) => (
	<ServerContext.Provider value={serverContextValue}>{children}</ServerContext.Provider>
);

export default ServerProvider;
