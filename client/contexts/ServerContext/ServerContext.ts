import { createContext, useCallback, useContext, useMemo } from 'react';

import { IServerInfo } from '../../../definition/IServerInfo';
import type { Serialized } from '../../../definition/Serialized';
import type { PathFor, Params, Return, Method } from './endpoints';
import {
	ServerMethodFunction,
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	ServerMethods,
} from './methods';

type ServerContextValue = {
	info?: IServerInfo;
	absoluteUrl: (path: string) => string;
	callMethod?: <MethodName extends ServerMethodName>(
		methodName: MethodName,
		...args: ServerMethodParameters<MethodName>
	) => Promise<ServerMethodReturn<MethodName>>;
	callEndpoint: <M extends Method, P extends PathFor<M>>(
		method: M,
		path: P,
		params: Params<M, P>[0],
	) => Promise<Serialized<Return<M, P>>>;
	uploadToEndpoint: (endpoint: string, params: any, formData: any) => Promise<void>;
	getStream: (
		streamName: string,
		options?: {},
	) => <T>(eventName: string, callback: (data: T) => void) => () => void;
};

export const ServerContext = createContext<ServerContextValue>({
	info: undefined,
	absoluteUrl: (path) => path,
	callEndpoint: () => {
		throw new Error('not implemented');
	},
	uploadToEndpoint: async () => undefined,
	getStream: () => () => (): void => undefined,
});

export const useServerInformation = (): IServerInfo => {
	const { info } = useContext(ServerContext);
	if (!info) {
		throw new Error('useServerInformation: no info available');
	}
	return info;
};

export const useAbsoluteUrl = (): ((path: string) => string) =>
	useContext(ServerContext).absoluteUrl;

export const useMethod = <MethodName extends keyof ServerMethods>(
	methodName: MethodName,
): ServerMethodFunction<MethodName> => {
	const { callMethod } = useContext(ServerContext);

	return useCallback(
		(...args: ServerMethodParameters<MethodName>) => {
			if (!callMethod) {
				throw new Error(
					`cannot use useMethod(${methodName}) hook without a wrapping ServerContext`,
				);
			}

			return callMethod(methodName, ...args);
		},
		[callMethod, methodName],
	);
};

export const useEndpoint = <M extends 'GET' | 'POST' | 'DELETE', P extends PathFor<M>>(
	method: M,
	path: P,
): ((params: Params<M, P>[0]) => Promise<Serialized<Return<M, P>>>) => {
	const { callEndpoint } = useContext(ServerContext);

	return useCallback((params) => callEndpoint(method, path, params), [callEndpoint, path, method]);
};

export const useUpload = (endpoint: string): ((params: any, formData: any) => Promise<void>) => {
	const { uploadToEndpoint } = useContext(ServerContext);
	return useCallback(
		(params, formData: any) => uploadToEndpoint(endpoint, params, formData),
		[endpoint, uploadToEndpoint],
	);
};

export const useStream = (
	streamName: string,
	options?: {},
): (<T>(eventName: string, callback: (data: T) => void) => () => void) => {
	const { getStream } = useContext(ServerContext);
	return useMemo(() => getStream(streamName, options), [getStream, streamName, options]);
};
