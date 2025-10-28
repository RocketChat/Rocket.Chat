import type { Serialized } from '@rocket.chat/core-typings';
import type {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	StreamerCallbackArgs,
	StreamNames,
	StreamKeys,
} from '@rocket.chat/ddp-client';
import type { Method, PathFor, OperationParams, OperationResult, UrlParams, PathPattern } from '@rocket.chat/rest-typings';
import type { UploadResult, ServerContextValue } from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { compile } from 'path-to-regexp';
import { useMemo, type ReactNode } from 'react';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { Info as info } from '../../app/utils/rocketchat.info';
import { useReactiveValue } from '../hooks/useReactiveValue';

const absoluteUrl = (path: string): string => Meteor.absoluteUrl(path);

const callMethod = <MethodName extends ServerMethodName>(
	methodName: MethodName,
	...args: ServerMethodParameters<MethodName>
): Promise<ServerMethodReturn<MethodName>> => Meteor.callAsync(methodName, ...args);

const callEndpoint = <TMethod extends Method, TPathPattern extends PathPattern>({
	method,
	pathPattern,
	keys,
	params,
	signal,
}: {
	method: TMethod;
	pathPattern: TPathPattern;
	keys: UrlParams<TPathPattern>;
	params: OperationParams<TMethod, TPathPattern>;
	signal?: AbortSignal;
}): Promise<Serialized<OperationResult<TMethod, TPathPattern>>> => {
	const compiledPath = compile(pathPattern, { encode: encodeURIComponent })(keys) as any;

	switch (method) {
		case 'GET':
			return sdk.rest.get(compiledPath, params as any, { signal }) as any;

		case 'POST':
			return sdk.rest.post(compiledPath, params as any, { signal }) as any;

		case 'PUT':
			return sdk.rest.put(compiledPath, params as never, { signal }) as never;

		case 'DELETE':
			return sdk.rest.delete(compiledPath, params as any, { signal }) as any;

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

const writeStream = <N extends StreamNames, K extends StreamKeys<N>>(streamName: N, streamKey: K, ...args: StreamerCallbackArgs<N, K>) =>
	sdk.publish(streamName, [streamKey, ...args]);

const disconnect = () => Meteor.disconnect();

const reconnect = () => Meteor.reconnect();

const getStatus = () => ({ ...Meteor.status() });

type ServerProviderProps = { children?: ReactNode };

const ServerProvider = ({ children }: ServerProviderProps) => {
	const { connected, status, retryCount, retryTime } = useReactiveValue(getStatus);

	const value = useMemo(
		(): ServerContextValue => ({
			connected,
			status,
			retryCount,
			retryTime,
			info,
			absoluteUrl,
			callMethod,
			callEndpoint,
			uploadToEndpoint,
			getStream,
			writeStream,
			disconnect,
			reconnect,
		}),
		[connected, retryCount, retryTime, status],
	);

	return <ServerContext.Provider children={children} value={value} />;
};

export default ServerProvider;
