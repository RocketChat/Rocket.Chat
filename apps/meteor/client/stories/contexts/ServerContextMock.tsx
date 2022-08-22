import { Serialized } from '@rocket.chat/core-typings';
import type { MatchPathPattern, Method, OperationParams, OperationResult, Path, PathFor } from '@rocket.chat/rest-typings';
import { ServerContext, ServerMethodName, ServerMethodParameters, ServerMethodReturn, UploadResult } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import { pathToRegexp } from 'path-to-regexp';
import React, { ContextType, ReactElement, ReactNode, useContext, useMemo } from 'react';

const logAction = action('ServerContext');

const randomDelay = (): Promise<UploadResult> => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

const uploadToEndpoint = (endpoint: PathFor<'POST'>, formData: any): Promise<UploadResult> =>
	Promise.resolve(logAction('uploadToEndpoint', endpoint, formData)).then(randomDelay);

const getStream = (
	streamName: string,
	options: {
		retransmit?: boolean | undefined;
		retransmitToSelf?: boolean | undefined;
	} = {},
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

type Operations = {
	[TOperation in Method extends infer TMethod
		? TMethod extends Method
			? PathFor<TMethod> extends infer TPath
				? TPath extends Path
					? {
							id: `${TMethod} ${TPath extends `/${string}` ? TPath : `/v1/${TPath}`}`;
							fn: (
								params: void extends OperationParams<TMethod, MatchPathPattern<TPath>>
									? void
									: OperationParams<TMethod, MatchPathPattern<TPath>>,
							) => Promise<
								void extends OperationResult<TMethod, MatchPathPattern<TPath>>
									? Serialized<OperationResult<TMethod, MatchPathPattern<TPath>>>
									: void
							>;
					  }
					: never
				: never
			: never
		: never as TOperation['id']]: TOperation['fn'];
};

type ServerContextMockProps = Omit<Partial<ContextType<typeof ServerContext>>, 'callEndpoint' | 'callMethod'> & {
	children: ReactNode;
	baseURL?: string | URL;
	callEndpoint?: {
		[TOperationID in keyof Operations]?: Operations[TOperationID] | 'infinite' | 'errored';
	};
	callMethod?: {
		[TMethodName in ServerMethodName]?:
			| ((...args: ServerMethodParameters<TMethodName>) => Promise<ServerMethodReturn<TMethodName>>)
			| 'infinite'
			| 'errored';
	};
};

const ServerContextMock = ({
	children,
	baseURL,
	callEndpoint = {},
	callMethod = {},
	...overrides
}: ServerContextMockProps): ReactElement => {
	const parent = useContext(ServerContext);

	const value = useMemo((): ContextType<typeof ServerContext> => {
		type ServerContextValue = ContextType<typeof ServerContext>;

		const absoluteURL: ServerContextValue['absoluteUrl'] = (path): string => {
			logAction('absoluteUrl', path);
			return new URL(path, baseURL).toString();
		};

		const mockedEndpoints = Object.entries(callEndpoint).map(
			([operationID, handler]): {
				match: (method: string, path: string) => boolean;
				handler: ((params: any) => Promise<unknown>) | 'infinite' | 'errored' | undefined;
			} => {
				const [_method, pathPattern] = operationID.split(' ');
				const pathRegexp = pathToRegexp(pathPattern[0] === '/' ? pathPattern : `/v1/${pathPattern}`);

				return {
					match: (method: string, path: string): boolean => _method === method && pathRegexp.test(path[0] === '/' ? path : `/v1/${path}`),
					handler: handler as any,
				};
			},
		);

		const _callEndpoint: ServerContextValue['callEndpoint'] = async <TMethod extends Method, TPath extends PathFor<TMethod>>(
			method: TMethod,
			path: TPath,
			params: OperationParams<TMethod, MatchPathPattern<TPath>>,
		): Promise<Serialized<OperationResult<TMethod, MatchPathPattern<TPath>>>> => {
			const mockedEndpoint = mockedEndpoints.find((endpoint) => endpoint.match(method, path));
			const handler = mockedEndpoint?.handler;

			if (!handler) {
				logAction('callEndpoint (undefined)', method, path, params);
				return undefined as any;
			}

			if (handler === 'infinite') {
				logAction('callEndpoint (infinite)', method, path, params);
				return new Promise(() => undefined);
			}

			if (handler === 'errored') {
				logAction('callEndpoint (errored)', method, path, params);
				throw new Error(`${method} ${path} failed`);
			}

			logAction('callEndpoint (intercepted)', method, path, params);
			return handler(params) as Promise<Serialized<OperationResult<TMethod, MatchPathPattern<TPath>>>>;
		};

		const _callMethod: ServerContextValue['callMethod'] = async <MethodName extends ServerMethodName>(
			methodName: MethodName,
			...args: ServerMethodParameters<MethodName>
		): Promise<ServerMethodReturn<MethodName>> => {
			const handler = callMethod[methodName];
			if (!handler) {
				logAction('callMethod (undefined)', methodName, ...args);
				return undefined as any;
			}

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
		};

		return {
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
			absoluteUrl: absoluteURL,
			callEndpoint: _callEndpoint,
			callMethod: _callMethod,
			uploadToEndpoint,
			getStream,
			...overrides,
		};
	}, [baseURL, callEndpoint, callMethod, overrides, parent]);

	return <ServerContext.Provider children={children} value={value} />;
};

export default ServerContextMock;
