import { createContext, useCallback, useContext, useMemo } from 'react';

interface IServerStream {
	on(eventName: string, callback: (data: any) => void): void;
	off(eventName: string, callback: (data: any) => void): void;
}

type ServerContextValue = {
	info: {};
	absoluteUrl: (path: string) => string;
	callMethod: (methodName: string, ...args: any[]) => Promise<any>;
	callEndpoint: (httpMethod: 'GET' | 'POST' | 'DELETE', endpoint: string, ...args: any[]) => Promise<any>;
	uploadToEndpoint: (endpoint: string, params: any, formData: any) => Promise<void>;
	getStream: (streamName: string, options?: {}) => IServerStream;
};

export const ServerContext = createContext<ServerContextValue>({
	info: {},
	absoluteUrl: (path) => path,
	callMethod: async () => undefined,
	callEndpoint: async () => undefined,
	uploadToEndpoint: async () => undefined,
	getStream: () => ({
		on: (): void => undefined,
		off: (): void => undefined,
	}),
});

export const useServerInformation = (): {} => useContext(ServerContext).info;

export const useAbsoluteUrl = (): ((path: string) => string) => useContext(ServerContext).absoluteUrl;

export const useMethod = (methodName: string): (...args: any[]) => Promise<any> => {
	const { callMethod } = useContext(ServerContext);
	return useCallback((...args: any[]) => callMethod(methodName, ...args), [callMethod, methodName]);
};

export const useEndpoint = (httpMethod: 'GET' | 'POST' | 'DELETE', endpoint: string): (...args: any[]) => Promise<any> => {
	const { callEndpoint } = useContext(ServerContext);
	return useCallback((...args: any[]) => callEndpoint(httpMethod, endpoint, ...args), [callEndpoint, httpMethod, endpoint]);
};

export const useUpload = (endpoint: string): (params: any, formData: any) => Promise<void> => {
	const { uploadToEndpoint } = useContext(ServerContext);
	return useCallback((params, formData: any) => uploadToEndpoint(endpoint, params, formData), [endpoint, uploadToEndpoint]);
};

export const useStream = (streamName: string, options?: {}): IServerStream => {
	const { getStream } = useContext(ServerContext);
	return useMemo(() => getStream(streamName, options), [getStream, streamName, options]);
};
