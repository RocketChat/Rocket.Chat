import { createContext, useCallback, useContext, useMemo } from 'react';

import type { IServerInfo } from '../../../definition/IServerInfo';
import type { Serialized } from '../../../definition/Serialized';
import type { Method, PathFor, OperationParams, MatchPathPattern, OperationResult, PathPattern } from '../../../definition/rest';
import { ServerMethodFunction, ServerMethodName, ServerMethodParameters, ServerMethodReturn, ServerMethods } from './methods';

export type UploadResult = {
	success: boolean;
	status: string;
	[key: string]: unknown;
};
type ServerContextValue = {
	info?: IServerInfo;
	absoluteUrl: (path: string) => string;
	callMethod?: <MethodName extends ServerMethodName>(
		methodName: MethodName,
		...args: ServerMethodParameters<MethodName>
	) => Promise<ServerMethodReturn<MethodName>>;
	callEndpoint: <TMethod extends Method, TPath extends PathFor<TMethod>>(
		method: TMethod,
		path: TPath,
		params: Serialized<OperationParams<TMethod, MatchPathPattern<TPath>>>,
	) => Promise<Serialized<OperationResult<TMethod, MatchPathPattern<TPath>>>>;
	uploadToEndpoint: (
		endpoint: string,
		params: any,
		formData: any,
	) =>
		| Promise<UploadResult>
		| {
				promise: Promise<UploadResult>;
		  };
	getStream: (streamName: string, options?: {}) => <T>(eventName: string, callback: (data: T) => void) => () => void;
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

export const useServerInformation = (): IServerInfo => {
	const { info } = useContext(ServerContext);
	if (!info) {
		throw new Error('useServerInformation: no info available');
	}
	return info;
};

export const useAbsoluteUrl = (): ((path: string) => string) => useContext(ServerContext).absoluteUrl;

export const useMethod = <MethodName extends keyof ServerMethods>(methodName: MethodName): ServerMethodFunction<MethodName> => {
	const { callMethod } = useContext(ServerContext);

	return useCallback(
		(...args: ServerMethodParameters<MethodName>) => {
			if (!callMethod) {
				throw new Error(`cannot use useMethod(${methodName}) hook without a wrapping ServerContext`);
			}

			return callMethod(methodName, ...args);
		},
		[callMethod, methodName],
	);
};

type EndpointFunction<TMethod extends Method, TPathPattern extends PathPattern> = (
	params: void extends OperationParams<TMethod, TPathPattern> ? void : Serialized<OperationParams<TMethod, TPathPattern>>,
) => Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;

export const useEndpoint = <TMethod extends Method, TPath extends PathFor<TMethod>>(
	method: TMethod,
	path: TPath,
): EndpointFunction<TMethod, MatchPathPattern<TPath>> => {
	const { callEndpoint } = useContext(ServerContext);

	return useCallback(
		(params: Serialized<OperationParams<TMethod, MatchPathPattern<TPath>>>) => callEndpoint(method, path, params),
		[callEndpoint, path, method],
	);
};

export const useUpload = (
	endpoint: string,
): ((params: any, formData: any) => Promise<UploadResult> | { promise: Promise<UploadResult> }) => {
	const { uploadToEndpoint } = useContext(ServerContext);
	return useCallback((params, formData: any) => uploadToEndpoint(endpoint, params, formData), [endpoint, uploadToEndpoint]);
};

export const useStream = (streamName: string, options?: {}): (<T>(eventName: string, callback: (data: T) => void) => () => void) => {
	const { getStream } = useContext(ServerContext);
	return useMemo(() => getStream(streamName, options), [getStream, streamName, options]);
};
