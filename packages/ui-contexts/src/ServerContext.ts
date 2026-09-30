import type { IServerInfo, Serialized } from '@rocket.chat/core-typings';
import type {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	StreamKeys,
	StreamNames,
	StreamerCallbackArgs,
	StreamerEvents,
} from '@rocket.chat/ddp-client';
import type { Method, OperationParams, OperationResult, PathFor, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import { createContext } from 'react';

export type UploadResult = {
	success: boolean;
	status: string;
	[key: string]: unknown;
};

export type ServerConnectionStatus = {
	connected: boolean;
	status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline';
	retryCount: number;
	retryTime?: number | undefined;
};

export type ServerContextValue = {
	/** Kept out of the value itself so a status change re-renders only the components that read it. */
	subscribeToConnectionStatus: (onStoreChange: () => void) => () => void;
	/** Must return the same object until the status changes. */
	getConnectionStatus: () => ServerConnectionStatus;
	info?: IServerInfo;
	absoluteUrl: (path: string) => string;
	callMethod?: <MethodName extends ServerMethodName>(
		methodName: MethodName,
		...args: ServerMethodParameters<MethodName>
	) => Promise<ServerMethodReturn<MethodName>>;
	callEndpoint: <TMethod extends Method, TPathPattern extends PathPattern>(args: {
		method: TMethod;
		pathPattern: TPathPattern;
		keys: UrlParams<TPathPattern>;
		params: OperationParams<TMethod, TPathPattern>;
		signal?: AbortSignal;
		keepalive?: boolean;
	}) => Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;
	uploadToEndpoint: (
		endpoint: PathFor<'POST'>,
		formData: any,
	) =>
		| Promise<UploadResult>
		| {
				promise: Promise<UploadResult>;
		  };
	getStream: <N extends StreamNames, K extends StreamKeys<N>>(
		streamName: N,
		_options?: {
			retransmit?: boolean | undefined;
			retransmitToSelf?: boolean | undefined;
		},
	) => (eventName: K, callback: (...args: StreamerCallbackArgs<N, K>) => void) => () => void;
	getStreamAll: <N extends StreamNames>(
		streamName: N,
	) => (callback: (eventName: string, args: StreamerEvents[N][number]['args']) => void) => () => void;
	writeStream: <N extends StreamNames, K extends StreamKeys<N>>(streamName: N, eventName: K, ...args: StreamerCallbackArgs<N, K>) => void;
	disconnect: () => void;
	reconnect: () => void;
};

const connectedStatus: ServerConnectionStatus = { connected: true, status: 'connected', retryCount: 0 };

export const ServerContext = createContext<ServerContextValue>({
	subscribeToConnectionStatus: () => () => undefined,
	getConnectionStatus: () => connectedStatus,
	info: undefined,
	absoluteUrl: (path) => path,
	callEndpoint: () => {
		throw new Error('not implemented');
	},
	uploadToEndpoint: async () => {
		throw new Error('not implemented');
	},
	getStream: () => () => (): void => undefined,
	getStreamAll: () => () => (): void => undefined,
	writeStream: () => {
		throw new Error('not implemented');
	},
	disconnect: () => {
		throw new Error('not implemented');
	},
	reconnect: () => {
		throw new Error('not implemented');
	},
});
