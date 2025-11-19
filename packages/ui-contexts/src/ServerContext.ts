import type { IServerInfo, Serialized } from '@rocket.chat/core-typings';
import type {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	StreamKeys,
	StreamNames,
	StreamerCallbackArgs,
} from '@rocket.chat/ddp-client';
import type { Method, OperationParams, OperationResult, PathFor, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import { createContext } from 'react';

export type UploadResult = {
	success: boolean;
	status: string;
	[key: string]: unknown;
};

export type ServerContextValue = {
	connected: boolean;
	status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline';
	retryCount: number;
	retryTime?: number | undefined;
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
	writeStream: <N extends StreamNames, K extends StreamKeys<N>>(streamName: N, eventName: K, ...args: StreamerCallbackArgs<N, K>) => void;
	disconnect: () => void;
	reconnect: () => void;
};

export const ServerContext = createContext<ServerContextValue>({
	connected: true,
	status: 'connected',
	retryCount: 0,
	info: undefined,
	absoluteUrl: (path) => path,
	callEndpoint: () => {
		throw new Error('not implemented');
	},
	uploadToEndpoint: async () => {
		throw new Error('not implemented');
	},
	getStream: () => () => (): void => undefined,
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
