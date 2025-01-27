import type { Serialized } from '@rocket.chat/core-typings';
import type { ServerMethodName, ServerMethodParameters, ServerMethodReturn } from '@rocket.chat/ddp-client';
import type { Method, OperationParams, OperationResult, PathFor, PathPattern } from '@rocket.chat/rest-typings';
import type { UploadResult } from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { ContextType, ReactElement, ReactNode } from 'react';
import { useContext, useMemo } from 'react';

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
): (<TEvent extends unknown[]>(eventName: string, callback: (...event: TEvent) => void) => () => void) => {
	logAction('getStream', streamName, options);

	return (eventName: string, callback: () => void): (() => void) => {
		const subId = Math.random().toString(16).slice(2);
		logAction('getStream.subscribe', streamName, eventName, subId);

		randomDelay().then(() => callback());

		return (): void => {
			logAction('getStream.unsubscribe', streamName, eventName, subId);
		};
	};
};

type Operations = {
	[TOperation in Method extends infer TMethod
		? TMethod extends Method
			? PathPattern extends infer TPathPattern
				? TPathPattern extends PathPattern
					? {
							id: `${TMethod} ${TPathPattern extends `/${string}` ? TPathPattern : `/v1/${TPathPattern}`}`;
							fn: (
								params: void extends OperationParams<TMethod, TPathPattern> ? void : OperationParams<TMethod, TPathPattern>,
							) => Promise<void extends OperationResult<TMethod, TPathPattern> ? Serialized<OperationResult<TMethod, TPathPattern>> : void>;
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
			try {
				return new URL(path, baseURL).toString();
			} catch (e) {
				return path;
			}
		};

		const mockedEndpoints = Object.entries(callEndpoint).map(
			([operationID, handler]): {
				match: (method: string, path: string) => boolean;
				handler: ((params: any) => Promise<unknown>) | 'infinite' | 'errored' | undefined;
			} => {
				const [_method, _pathPattern] = operationID.split(' ');
				return {
					match: (method: string, pathPattern: string): boolean => _method === method && _pathPattern === pathPattern,
					handler: handler as any,
				};
			},
		);

		const _callEndpoint: ServerContextValue['callEndpoint'] = async <TMethod extends Method, TPathPattern extends PathPattern>({
			method,
			pathPattern,
			params,
		}: {
			method: TMethod;
			pathPattern: TPathPattern;
			params: OperationParams<TMethod, TPathPattern>;
		}): Promise<Serialized<OperationResult<TMethod, TPathPattern>>> => {
			const mockedEndpoint = mockedEndpoints.find((endpoint) => endpoint.match(method, pathPattern));
			const handler = mockedEndpoint?.handler;

			if (!handler) {
				logAction('callEndpoint (undefined)', method, pathPattern, params);
				return undefined as any;
			}

			if (handler === 'infinite') {
				logAction('callEndpoint (infinite)', method, pathPattern, params);
				return new Promise(() => undefined);
			}

			if (handler === 'errored') {
				logAction('callEndpoint (errored)', method, pathPattern, params);
				throw new Error(`${method} ${pathPattern} failed`);
			}

			logAction('callEndpoint (intercepted)', method, pathPattern, params);
			return handler(params) as Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;
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
				return new Promise<any>(() => undefined);
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
