import type { Serialized } from '@rocket.chat/core-typings';
import type { Method, PathPattern, OperationParams, UrlParams, OperationResult } from '@rocket.chat/rest-typings';
import type { EndpointFunction } from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import type { ContextType, ReactNode } from 'react';

type RegisterEndpoint = <TMethod extends Method, TPathPattern extends PathPattern>(
	method: TMethod,
	pathPattern: TPathPattern,
	endpoint: EndpointFunction<TMethod, TPathPattern>,
) => void;

type CallEndpoint = <TMethod extends Method, TPathPattern extends PathPattern>(args: {
	method: TMethod;
	pathPattern: TPathPattern;
	keys: UrlParams<TPathPattern>;
	params: OperationParams<TMethod, TPathPattern>;
}) => Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;

// this function should be used to create a new instance of `callEndpoint` to be passed to the `ServerProviderMock`
// as the second parameter, it returns a function that can be used to register endpoint mocks
// the rest should be self-explanatory, just rely on the types.
export const makeCallEndpoint = (): [CallEndpoint, RegisterEndpoint] => {
	const endpoints = new Map<`${Method}/${PathPattern}`, (params: any) => Promise<unknown>>();

	const getEndpoint = <TMethod extends Method, TPathPattern extends PathPattern>(
		method: TMethod,
		pathPattern: TPathPattern,
	): EndpointFunction<TMethod, TPathPattern> => {
		const endpoint = endpoints.get(`${method}/${pathPattern}`);
		if (!endpoint) {
			throw new Error('Endpoint not implemented');
		}

		return endpoint as EndpointFunction<TMethod, TPathPattern>;
	};

	const registerEndpoint: RegisterEndpoint = (method, pathPattern, endpoint) => {
		endpoints.set(`${method}/${pathPattern}`, endpoint);
	};

	const callEndpoint: CallEndpoint = (args) => {
		const endpoint = getEndpoint(args.method, args.pathPattern);
		if (!endpoint) {
			throw new Error('Endpoint not implemented');
		}
		return endpoint(args.params);
	};

	return [callEndpoint, registerEndpoint];
};

const absoluteUrl = () => ''; // to be implemented
const uploadToEndpoint = async () => {
	throw new Error('not implemented');
}; // to be implemented
const getStream = () => () => () => undefined; // to be implemented
const callEndpoint = () => {
	throw new Error('not implemented');
}; // to be implemented

const contextValue = {
	info: undefined,
	absoluteUrl,
	// callMethod,
	callEndpoint,
	uploadToEndpoint,
	getStream,
	reconnect: () => undefined,
	disconnect: () => undefined,
};

type ServerProviderMockProps = {
	children?: ReactNode;
	callEndpoint?: ContextType<typeof ServerContext>['callEndpoint'];
};

const ServerProviderMock = ({ children, callEndpoint }: ServerProviderMockProps) => {
	const value = useMemo(() => ({ ...contextValue, callEndpoint: callEndpoint ?? contextValue.callEndpoint }), [callEndpoint]);
	return <ServerContext.Provider children={children} value={value} />;
};

export default ServerProviderMock;
