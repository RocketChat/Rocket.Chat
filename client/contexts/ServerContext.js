import { createContext, useCallback, useContext } from 'react';

export const ServerContext = createContext({
	info: {},
	absoluteUrl: (path) => path,
	callMethod: async () => {},
	callEndpoint: async () => {},
});

export const useServerInformation = () => useContext(ServerContext).info;

export const useAbsoluteUrl = () => useContext(ServerContext).absoluteUrl;

export const useMethod = (methodName) => {
	const { callMethod } = useContext(ServerContext);
	return useCallback((...args) => callMethod(methodName, ...args), [callMethod, methodName]);
};

export const useEndpoint = (httpMethod, endpoint) => {
	const { callEndpoint } = useContext(ServerContext);
	return useCallback((...args) => callEndpoint(httpMethod, endpoint, ...args), [callEndpoint, httpMethod, endpoint]);
};
