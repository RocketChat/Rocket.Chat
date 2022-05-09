import { Serialized } from '@rocket.chat/core-typings';
import type { Method, PathFor, MatchPathPattern, OperationParams, OperationResult } from '@rocket.chat/rest-typings';
import { ServerContext, ServerMethodName, ServerMethodParameters, ServerMethodReturn, UploadResult } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { FC } from 'react';

import { Info as info, APIClient } from '../../app/utils/client';

const absoluteUrl = (path: string): string => Meteor.absoluteUrl(path);

const callMethod = <MethodName extends ServerMethodName>(
	methodName: MethodName,
	...args: ServerMethodParameters<MethodName>
): Promise<ServerMethodReturn<MethodName>> =>
	new Promise((resolve, reject) => {
		Meteor.call(methodName, ...args, (error: Error, result: ServerMethodReturn<MethodName>) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(result);
		});
	});

const callEndpoint = <TMethod extends Method, TPath extends PathFor<TMethod>>(
	method: TMethod,
	path: TPath,
	params: Serialized<OperationParams<TMethod, MatchPathPattern<TPath>>>,
): Promise<Serialized<OperationResult<TMethod, MatchPathPattern<TPath>>>> => {
	const api = path[0] === '/' ? APIClient : APIClient.v1;
	const endpointPath = path[0] === '/' ? path.slice(1) : path;

	switch (method) {
		case 'GET':
			return api.get(endpointPath, params);

		case 'POST':
			return api.post(endpointPath, {}, params);

		case 'DELETE':
			return api.delete(endpointPath, params);

		default:
			throw new Error('Invalid HTTP method');
	}
};

const uploadToEndpoint = (endpoint: string, params: any, formData: any): Promise<UploadResult> => {
	if (endpoint[0] === '/') {
		return APIClient.upload(endpoint.slice(1), params, formData).promise;
	}

	return APIClient.v1.upload(endpoint, params, formData).promise;
};

const getStream = (streamName: string, options: {} = {}): (<T>(eventName: string, callback: (data: T) => void) => () => void) => {
	const streamer = Meteor.StreamerCentral.instances[streamName]
		? Meteor.StreamerCentral.instances[streamName]
		: new Meteor.Streamer(streamName, options);

	return (eventName, callback): (() => void) => {
		streamer.on(eventName, callback);
		return (): void => {
			streamer.removeListener(eventName, callback);
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
