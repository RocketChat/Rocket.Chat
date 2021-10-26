import { action } from '@storybook/addon-actions';
import React, { ContextType, FC } from 'react';

import {
	Method,
	Params,
	PathFor,
	Return,
	ServerContext,
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
} from '../../../client/contexts/ServerContext';
import { Serialized } from '../../../definition/Serialized';

const logAction = action('ServerProvider');

const randomDelay = () => new Promise<void>((resolve) => setTimeout(resolve, Math.random() * 1000));

const absoluteUrl = (path: string): string => new URL(path, '/').toString();

const callMethod = <MethodName extends ServerMethodName>(
	methodName: MethodName,
	...args: ServerMethodParameters<MethodName>
): Promise<ServerMethodReturn<MethodName>> =>
	Promise.resolve(logAction('callMethod', methodName, ...args))
		.then(randomDelay)
		.then(() => undefined as any);

const callEndpoint = <M extends Method, P extends PathFor<M>>(
	method: M,
	path: P,
	params: Serialized<Params<M, P>[0]>,
): Promise<Serialized<Return<M, P>>> =>
	Promise.resolve(logAction('callEndpoint', method, path, params))
		.then(randomDelay)
		.then(() => undefined as any);

const uploadToEndpoint = (endpoint: string, params: any, formData: any): Promise<void> =>
	Promise.resolve(logAction('uploadToEndpoint', endpoint, params, formData)).then(randomDelay);

const getStream = (
	streamName: string,
	options: {} = {},
): (<T>(eventName: string, callback: (data: T) => void) => () => void) => {
	logAction('getStream', streamName, options);

	return (eventName, callback): (() => void) => {
		const subId = Math.random().toString(16).slice(2);
		logAction('getStream.subscribe', streamName, eventName, subId);

		randomDelay().then(() => callback(undefined as any));

		return (): void => {
			logAction('getStream.unsubscribe', streamName, eventName, subId);
		};
	};
};

const ServerProviderMock: FC<Partial<ContextType<typeof ServerContext>>> = ({
	children,
	...overrides
}) => (
	<ServerContext.Provider
		children={children}
		value={{
			info: {
				version: 'x.y.z',
				build: {
					platform: 'storybook',
					arch: 'storybook cpu',
					cpus: 1,
					date: new Date().toLocaleDateString(),
					nodeVersion: 'lts',
					osRelease: 'x',
					freeMemory: 639 * 1024,
					totalMemory: 640 * 1024,
				},
				commit: {},
				marketplaceApiVersion: 'x.y.z',
			},
			absoluteUrl,
			callMethod,
			callEndpoint,
			uploadToEndpoint,
			getStream,
			...overrides,
		}}
	/>
);

export default ServerProviderMock;
