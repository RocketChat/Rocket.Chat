import { action } from '@storybook/addon-actions';
import React, { ContextType, FC, useCallback, useContext, useMemo } from 'react';

import {
	ServerContext,
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	UploadResult,
} from '../../../client/contexts/ServerContext';
import { Serialized } from '../../../definition/Serialized';
import { MatchPathPattern, Method, OperationParams, OperationResult, Path, PathFor } from '../../../definition/rest';

const logAction = action('ServerContext');

const randomDelay = (): Promise<UploadResult> => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

const uploadToEndpoint = (endpoint: string, params: any, formData: any): Promise<UploadResult> =>
	Promise.resolve(logAction('uploadToEndpoint', endpoint, params, formData)).then(randomDelay);

const getStream = (streamName: string, options: {} = {}): (<T>(eventName: string, callback: (data: T) => void) => () => void) => {
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

type Operations = {
	[TOperation in Method extends infer TMethod
		? TMethod extends Method
			? PathFor<TMethod> extends infer TPath
				? TPath extends Path
					? {
							id: `${TMethod} ${TPath}`;
							fn: (
								params: OperationParams<TMethod, MatchPathPattern<TPath>>,
							) => Promise<Serialized<OperationResult<TMethod, MatchPathPattern<TPath>>>>;
					  }
					: never
				: never
			: never
		: never as TOperation['id']]: TOperation['fn'];
};

type ServerProviderMockProps = Omit<Partial<ContextType<typeof ServerContext>>, 'callEndpoint' | 'callMethod'> & {
	baseURL?: string | URL;
	callEndpoint?: {
		[TOperationID in keyof Operations]?: Operations[TOperationID];
	};
	callMethod?: {
		[TMethodName in ServerMethodName]?:
			| ((...args: ServerMethodParameters<TMethodName>) => Promise<ServerMethodReturn<TMethodName>>)
			| 'infinite'
			| 'errored';
	};
};

const ServerProviderMock: FC<ServerProviderMockProps> = ({ children, baseURL, callEndpoint = {}, callMethod = {}, ...overrides }) => {
	const parent = useContext(ServerContext);

	const _callEndpoint = useCallback(
		async <TMethod extends Method, TPath extends PathFor<TMethod>>(
			method: TMethod,
			path: TPath,
			params: Serialized<OperationParams<TMethod, MatchPathPattern<TPath>>>,
		): Promise<Serialized<OperationResult<TMethod, MatchPathPattern<TPath>>>> => {
			const operationId = `${method} ${path[0] === '/' ? path : `/v1/${path}`}`;

			if (operationId in callEndpoint) {
				const handler = callEndpoint[operationId];

				if (handler === 'infinite') {
					logAction('callEndpoint (infinite)', operationId, params);
					return new Promise(() => undefined);
				}

				if (handler === 'errored') {
					logAction('callEndpoint (errored)', operationId, params);
					throw new Error(`${operationId} failed`);
				}

				logAction('callEndpoint (intercepted)', operationId, params);
				return handler(params);
			}

			logAction('callEndpoint (undefined)', operationId, params);
			return undefined as any;
		},
		[callEndpoint],
	);

	const _callMethod = useCallback(
		async <MethodName extends ServerMethodName>(
			methodName: MethodName,
			...args: ServerMethodParameters<MethodName>
		): Promise<ServerMethodReturn<MethodName>> => {
			if (methodName in callMethod) {
				const handler = callMethod[methodName];

				if (handler === 'infinite') {
					logAction('callMethod (infinite)', methodName, ...args);
					return new Promise(() => undefined);
				}

				if (handler === 'errored') {
					logAction('callMethod (errored)', methodName, ...args);
					throw new Error(`${methodName} failed`);
				}

				logAction('callMethod (intercepted)', methodName, ...args);
				return handler(...args);
			}

			logAction('callMethod (undefined)', methodName, ...args);
			return undefined as any;
		},
		[callMethod],
	);

	const value = useMemo(
		(): ContextType<typeof ServerContext> => ({
			...parent,
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
			absoluteUrl: (path): string => {
				logAction('absoluteUrl', path);
				return new URL(path, baseURL).toString();
			},
			callEndpoint: _callEndpoint,
			callMethod: _callMethod,
			uploadToEndpoint,
			getStream,
			...overrides,
		}),
		[_callEndpoint, _callMethod, baseURL, overrides, parent],
	);

	return <ServerContext.Provider children={children} value={value} />;
};

export default ServerProviderMock;
