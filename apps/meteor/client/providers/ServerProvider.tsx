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
	switch (method) {
		case 'GET':
			return APIClient.get(path as Parameters<typeof APIClient.get>[0], params as any | undefined) as any;

		case 'POST':
			return APIClient.post(path as Parameters<typeof APIClient.post>[0], params as never) as ReturnType<typeof APIClient.post>;

		case 'DELETE':
			return APIClient.delete(path as Parameters<typeof APIClient.delete>[0], params as never) as ReturnType<typeof APIClient.delete>;

		default:
			throw new Error('Invalid HTTP method');
	}
};

const uploadToEndpoint = (endpoint: PathFor<'POST'>, formData: any): Promise<UploadResult> => APIClient.post(endpoint, formData as never);

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
