import type { Serialized } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { Method, PathFor, OperationParams, OperationResult, UrlParams, PathPattern } from '@rocket.chat/rest-typings';
import type {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	StreamerCallbackArgs,
	UploadResult,
	StreamNames,
	StreamKeys,
} from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { compile } from 'path-to-regexp';
import type { FC } from 'react';
import React from 'react';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { Info as info } from '../../app/utils/rocketchat.info';

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
}: {
	method: TMethod;
	pathPattern: TPathPattern;
	keys: UrlParams<TPathPattern>;
	params: OperationParams<TMethod, TPathPattern>;
}): Promise<Serialized<OperationResult<TMethod, TPathPattern>>> => {
	const compiledPath = compile(pathPattern, { encode: encodeURIComponent })(keys) as any;

	switch (method) {
		case 'GET':
			return sdk.rest.get(compiledPath, params as any) as any;

		case 'POST':
			return sdk.rest.post(compiledPath, params as any) as any;

		case 'PUT':
			return sdk.rest.put(compiledPath, params as never) as never;

		case 'DELETE':
			return sdk.rest.delete(compiledPath, params as any) as any;

		default:
			throw new Error('Invalid HTTP method');
	}
};

const uploadToEndpoint = (endpoint: PathFor<'POST'>, formData: any): Promise<UploadResult> => sdk.rest.post(endpoint as any, formData);

type EventMap<N extends StreamNames = StreamNames, K extends StreamKeys<N> = StreamKeys<N>> = {
	[key in `${N}/${K}`]: StreamerCallbackArgs<N, K>;
};

const ee = new Emitter<EventMap>();

const events = new Map<string, () => void>();

const getStream = <N extends StreamNames>(
	streamName: N,
	_options?: {
		retransmit?: boolean | undefined;
		retransmitToSelf?: boolean | undefined;
	},
) => {
	return <K extends StreamKeys<N>>(eventName: K, callback: (...args: StreamerCallbackArgs<N, K>) => void): (() => void) => {
		const eventLiteral = `${streamName}/${eventName}` as const;
		const emitterCallback = (args?: unknown): void => {
			if (!args || !Array.isArray(args)) {
				throw new Error('Invalid streamer callback');
			}
			callback(...(args as StreamerCallbackArgs<N, K>));
		};

		ee.on(eventLiteral, emitterCallback);

		const streamHandler = (...args: StreamerCallbackArgs<N, K>): void => {
			ee.emit(eventLiteral, args);
		};

		const stop = (): void => {
			// If someone is still listening, don't unsubscribe
			ee.off(eventLiteral, emitterCallback);

			if (ee.has(eventLiteral)) {
				return;
			}

			const unsubscribe = events.get(eventLiteral);
			if (unsubscribe) {
				unsubscribe();
				events.delete(eventLiteral);
			}
		};

		if (!events.has(eventLiteral)) {
			events.set(eventLiteral, sdk.stream(streamName, [eventName], streamHandler).stop);
		}
		return stop;
	};
};

const contextValue = {
	info,
	absoluteUrl,
	callMethod,
	callEndpoint,
	uploadToEndpoint,
	getStream,
};

const ServerProvider: FC = ({ children }) => <ServerContext.Provider children={children} value={contextValue} />;

export default ServerProvider;
