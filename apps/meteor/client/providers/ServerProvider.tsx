import type { Serialized } from '@rocket.chat/core-typings';
import type { Method, PathFor, OperationParams, OperationResult, UrlParams, PathPattern } from '@rocket.chat/rest-typings';
import type { ServerMethodName, ServerMethodParameters, ServerMethodReturn, UploadResult } from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { compile } from 'path-to-regexp';
import type { FC } from 'react';
import React from 'react';

import { Info as info, APIClient } from '../../app/utils/client';

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
	const compiledPath = compile(pathPattern, { encode: encodeURIComponent })(keys);

	switch (method) {
		case 'GET':
			return APIClient.get(compiledPath as any, params as any) as any;

		case 'POST':
			return APIClient.post(compiledPath as any, params as any) as any;

		case 'PUT':
			return APIClient.put(compiledPath as any, params as any) as any;

		case 'DELETE':
			return APIClient.delete(compiledPath as any, params as any) as any;

		default:
			throw new Error('Invalid HTTP method');
	}
};

const uploadToEndpoint = (endpoint: PathFor<'POST'>, formData: any): Promise<UploadResult> => APIClient.post(endpoint as any, formData);

const getStream = (
	streamName: string,
	options?: {
		retransmit?: boolean | undefined;
		retransmitToSelf?: boolean | undefined;
	},
): (<TEvent extends unknown[]>(eventName: string, callback: (...event: TEvent) => void) => () => void) => {
	const streamer = Meteor.StreamerCentral.instances[streamName]
		? Meteor.StreamerCentral.instances[streamName]
		: new Meteor.Streamer(streamName, options);

	return (eventName, callback): (() => void) => {
		streamer.on(eventName, callback as (...args: any[]) => void);
		return (): void => {
			streamer.removeListener(eventName, callback as (...args: any[]) => void);
		};
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
