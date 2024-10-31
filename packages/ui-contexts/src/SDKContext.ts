import type { RestClientInterface } from '@rocket.chat/api-client';
import type { ClientStream, ServerMethods, StreamerCallbackArgs, StreamKeys, StreamNames } from '@rocket.chat/ddp-client';
import { createContext, useContext } from 'react';

export interface ISDKClient {
	rest: RestClientInterface;
	stop: (streamName: string, key: string) => void;
	stream: {
		(name: string, params: unknown[], cb: (...data: unknown[]) => void): ReturnType<ClientStream['subscribe']>;
		<N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			key: K,
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): ReturnType<ClientStream['subscribe']>;
		<N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			args: [key: K, ...args: unknown[]],
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): ReturnType<ClientStream['subscribe']>;
	};
	publish: (name: string, args: unknown[]) => void;
	call: <T extends keyof ServerMethods>(method: T, ...args: Parameters<ServerMethods[T]>) => Promise<ReturnType<ServerMethods[T]>>;
}

export const SDKContext = createContext<ISDKClient | undefined>(undefined);

export const useSDK = (): ISDKClient => {
	const sdk = useContext(SDKContext);
	if (!sdk) {
		throw new Error('SDKContext not found');
	}

	return sdk;
};
