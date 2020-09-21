import { createContext, useCallback, useContext, useMemo, useState, useEffect, useRef } from 'react';

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

export enum AsyncState {
	LOADING = 'loading',
	DONE = 'done',
	ERROR = 'error',
}

export const useMethodData = <T>(methodName: string, args: any[] = []): [T | null, AsyncState, () => void] => {
	const getData: (...args: unknown[]) => Promise<T> = useMethod(methodName);
	const [[data, state], updateState] = useState<[T | null, AsyncState]>([null, AsyncState.LOADING]);

	const isMountedRef = useRef(true);

	useEffect(() => (): void => {
		isMountedRef.current = false;
	}, []);

	const fetchData = useCallback(() => {
		updateState(([data]) => [data, AsyncState.LOADING]);

		getData(...args)
			.then((data) => {
				if (!isMountedRef.current) {
					return;
				}

				updateState([data, AsyncState.DONE]);
			})
			.catch((error) => {
				if (!isMountedRef.current) {
					return;
				}

				updateState(([data]) => [data, AsyncState.ERROR]);
				console.error(error);
			});
	}, [getData, args]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return [data, state, fetchData];
};

export const usePolledMethodData = <T>(methodName: string, args: any[] = [], intervalMs: number): [T | null, AsyncState, () => void] => {
	const [data, state, fetchData] = useMethodData<T>(methodName, args);

	useEffect(() => {
		const timer = setInterval(() => {
			fetchData();
		}, intervalMs);

		return (): void => {
			clearInterval(timer);
		};
	}, [fetchData, intervalMs]);

	return [data, state, fetchData];
};
