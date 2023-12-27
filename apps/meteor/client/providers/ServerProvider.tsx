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

const ee = new Emitter<Record<string, void>>();

const events = new Map<string, () => void>();

const getStream = <N extends StreamNames, K extends StreamKeys<N>>(
	streamName: N,
	_options?: {
		retransmit?: boolean | undefined;
		retransmitToSelf?: boolean | undefined;
	},
): ((eventName: K, callback: (...args: StreamerCallbackArgs<N, K>) => void) => () => void) => {
	const stream = getStream(streamName);
	return (eventName, callback): (() => void) => {
		ee.on(`${streamName}/${eventName}`, callback);

		const handler = (...args: any[]): void => {
			ee.emit(`${streamName}/${eventName}`, ...args);
		};

		const stop = (): void => {
			// If someone is still listening, don't unsubscribe
			ee.off(`${streamName}/${eventName}`, callback);

			if (ee.has(`${streamName}/${eventName}`)) {
				return;
			}

			const unsubscribe = events.get(`${streamName}/${eventName}`);
			if (unsubscribe) {
				unsubscribe();
				events.delete(`${streamName}/${eventName}`);
			}
		};

		if (!events.has(`${streamName}/${eventName}`)) {
			events.set(`${streamName}/${eventName}`, stream(eventName, handler));
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
