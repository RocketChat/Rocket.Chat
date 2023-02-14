import type { IServerInfo, Serialized } from '@rocket.chat/core-typings';
import type { Method, OperationParams, OperationResult, PathFor, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import { createContext } from 'react';

import type { ServerMethodName, ServerMethodParameters, ServerMethodReturn } from './methods';

export type UploadResult = {
	success: boolean;
	status: string;
	[key: string]: unknown;
};

export type ServerContextValue = {
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
	}) => Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;
	uploadToEndpoint: (
		endpoint: PathFor<'POST'>,
		formData: any,
	) =>
		| Promise<UploadResult>
		| {
				promise: Promise<UploadResult>;
		  };
	getStream: (
		streamName: string,
		options?: {
			retransmit?: boolean | undefined;
			retransmitToSelf?: boolean | undefined;
		},
	) => <TEvent extends unknown[]>(eventName: string, callback: (...event: TEvent) => void) => () => void;
};

export const ServerContext = createContext<ServerContextValue>({
	info: undefined,
	absoluteUrl: (path) => path,
	callEndpoint: () => {
		throw new Error('not implemented');
	},
	uploadToEndpoint: async () => {
		throw new Error('not implemented');
	},
	getStream: () => () => (): void => undefined,
});
