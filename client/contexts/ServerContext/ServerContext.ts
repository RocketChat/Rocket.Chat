import { createContext, useCallback, useContext, useMemo } from 'react';

import {
	ServerEndpointMethodOf,
	ServerEndpointPath,
	ServerEndpointFunction,
	ServerEndpointRequestPayload,
	ServerEndpointFormData,
	ServerEndpointResponsePayload,
} from './endpoints';
import {
	ServerMethodFunction,
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	ServerMethods,
} from './methods';

type ServerContextValue = {
	info: {};
	absoluteUrl: (path: string) => string;
	callMethod?: <MethodName extends ServerMethodName>(
		methodName: MethodName,
		...args: ServerMethodParameters<MethodName>
	) => Promise<ServerMethodReturn<MethodName>>;
	callEndpoint?: <Method extends ServerEndpointMethodOf<Path>, Path extends ServerEndpointPath>(
		httpMethod: Method,
		endpoint: Path,
		params: ServerEndpointRequestPayload<Method, Path>,
		formData?: ServerEndpointFormData<Method, Path>,
	) => Promise<ServerEndpointResponsePayload<Method, Path>>;
	uploadToEndpoint: (endpoint: string, params: any, formData: any) => Promise<void>;
	getStream: (
		streamName: string,
		options?: {},
	) => <T>(eventName: string, callback: (data: T) => void) => () => void;
};

export const ServerContext = createContext<ServerContextValue>({
	info: {},
	absoluteUrl: (path) => path,
	uploadToEndpoint: async () => undefined,
	getStream: () => () => (): void => undefined,
});

export const useServerInformation = (): {} => useContext(ServerContext).info;

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

export const useEndpoint = <
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath,
>(
	httpMethod: Method,
	endpoint: Path,
): ServerEndpointFunction<Method, Path> => {
	const { callEndpoint } = useContext(ServerContext);

	return useCallback(
		(
			params: ServerEndpointRequestPayload<Method, Path>,
			formData?: ServerEndpointFormData<Method, Path>,
		) => {
			if (!callEndpoint) {
				throw new Error(
					`cannot use useEndpoint(${httpMethod}, ${endpoint}) hook without a wrapping ServerContext`,
				);
			}

			return callEndpoint(httpMethod, endpoint, params, formData);
		},
		[callEndpoint, endpoint, httpMethod],
	);
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
