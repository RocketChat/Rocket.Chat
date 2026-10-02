import type { Serialized } from '@rocket.chat/core-typings';
import type {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	StreamerCallbackArgs,
	StreamNames,
	StreamKeys,
} from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';
import type { Method, PathFor, OperationParams, OperationResult, UrlParams, PathPattern } from '@rocket.chat/rest-typings';
import type { ServerConnectionStatus, ServerContextValue, UploadResult } from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { compile } from 'path-to-regexp';
import type { ComponentChildren } from 'preact';
import { useMemo } from 'preact/hooks';

import { useStore } from '../store';
import { useSDK } from './SDKProvider';

const connectionStatuses = {
	connected: { status: 'connected', connected: true, retryCount: 0 },
	connecting: { status: 'connecting', connected: false, retryCount: 0 },
	failed: { status: 'failed', connected: false, retryCount: 0 },
	waiting: { status: 'waiting', connected: false, retryCount: 0 },
	offline: { status: 'offline', connected: false, retryCount: 0 },
} as const satisfies Record<ServerConnectionStatus['status'], ServerConnectionStatus>;

const getConnectionStatus = (sdkStatus: string): ServerConnectionStatus => {
	switch (sdkStatus) {
		case 'connecting':
			return connectionStatuses.connecting;
		case 'connected':
			return connectionStatuses.connected;
		case 'failed':
			return connectionStatuses.failed;
		case 'idle':
			return connectionStatuses.waiting;
		default:
			return connectionStatuses.offline;
	}
};

export type ServerProviderProps = { children: ComponentChildren; serverURL: string };

const ServerProvider = ({ children, serverURL: host }: ServerProviderProps) => {
	const sdk = useSDK();

	const { token } = useStore();

	const contextValue = useMemo(() => {
		const absoluteUrl = (path: string): string => {
			return `${host}${path}`;
		};

		const callMethod = <MethodName extends ServerMethodName>(
			methodName: MethodName,
			...args: ServerMethodParameters<MethodName>
		): Promise<ServerMethodReturn<MethodName>> => sdk.client.callAsync(methodName, ...args);

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
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					return sdk.rest.get(compiledPath, params) as any;

				case 'POST':
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					return sdk.rest.post(compiledPath, params) as any;

				case 'PUT':
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					return sdk.rest.put(compiledPath, params as never) as any;

				case 'DELETE':
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					return sdk.rest.delete(compiledPath, params) as any;

				default:
					throw new Error('Invalid HTTP method');
			}
		};

		const uploadToEndpoint = (endpoint: PathFor<'POST'>, formData: any): Promise<UploadResult> => sdk.rest.post(endpoint as any, formData);

		const getStream = <N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			_options?: {
				retransmit?: boolean | undefined;
				retransmitToSelf?: boolean | undefined;
			},
		): ((eventName: K, callback: (...args: StreamerCallbackArgs<N, K>) => void) => () => void) => {
			return (eventName, callback): (() => void) => {
				return sdk.stream(streamName, [eventName, { visitorToken: token, token }], callback).stop;
			};
		};

		const ee = new Emitter<Record<string, void>>();

		const events = new Map<string, () => void>();

		const getSingleStream = <N extends StreamNames, K extends StreamKeys<N>>(
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
			subscribeToConnectionStatus: (onStoreChange: () => void) => sdk.connection.on('connection', onStoreChange),
			getConnectionStatus: () => getConnectionStatus(sdk.connection.status),
			// info,
			absoluteUrl,
			callMethod,
			callEndpoint,
			uploadToEndpoint,
			getStream,
			getSingleStream,
			reconnect: () => sdk.connection.reconnect(),
		} as unknown as ServerContextValue; // FIXME

		return contextValue;
	}, [host, sdk, token]);

	return <ServerContext.Provider value={contextValue}>{children}</ServerContext.Provider>;
};

export default ServerProvider;
