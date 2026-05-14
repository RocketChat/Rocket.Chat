import type { Serialized } from '@rocket.chat/core-typings';
import type {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
	StreamerCallbackArgs,
	StreamNames,
	StreamKeys,
} from '@rocket.chat/ddp-client';
import type { Method, PathFor, OperationParams, OperationResult, UrlParams, PathPattern } from '@rocket.chat/rest-typings';
import type { UploadResult, ServerContextValue } from '@rocket.chat/ui-contexts';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { compile } from 'path-to-regexp';
import { useMemo, type ReactNode } from 'react';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { Info as info } from '../../app/utils/rocketchat.info';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { absoluteUrl } from '../lib/absoluteUrl';
import { ensureConnectedAndAuthenticated, getDdpSdk } from '../lib/sdk/ddpSdk';
import { isSdkTransportEnabled } from '../lib/sdk/sdkTransportEnabled';

const sdkTransportEnabled = isSdkTransportEnabled();

const callMethod = <MethodName extends ServerMethodName>(
	methodName: MethodName,
	...args: ServerMethodParameters<MethodName>
): Promise<ServerMethodReturn<MethodName>> => sdk.call(methodName, ...(args as any)) as Promise<ServerMethodReturn<MethodName>>;

const callEndpoint = <TMethod extends Method, TPathPattern extends PathPattern>({
	method,
	pathPattern,
	keys,
	params,
	signal,
}: {
	method: TMethod;
	pathPattern: TPathPattern;
	keys: UrlParams<TPathPattern>;
	params: OperationParams<TMethod, TPathPattern>;
	signal?: AbortSignal;
}): Promise<Serialized<OperationResult<TMethod, TPathPattern>>> => {
	const compiledPath = compile(pathPattern, { encode: encodeURIComponent })(keys) as any;

	switch (method) {
		case 'GET':
			return sdk.rest.get(compiledPath, params as any, { signal }) as any;

		case 'POST':
			return sdk.rest.post(compiledPath, params as any, { signal }) as any;

		case 'PUT':
			return sdk.rest.put(compiledPath, params as never, { signal }) as never;

		case 'DELETE':
			return sdk.rest.delete(compiledPath, params as any, { signal }) as any;

		default:
			throw new Error('Invalid HTTP method');
	}
};

const uploadToEndpoint = (endpoint: PathFor<'POST'>, formData: any): Promise<UploadResult> => sdk.rest.post(endpoint as any, formData);

const getStream =
	<N extends StreamNames>(
		streamName: N,
		_options?: {
			retransmit?: boolean | undefined;
			retransmitToSelf?: boolean | undefined;
		},
	) =>
	<K extends StreamKeys<N>>(eventName: K, callback: (...args: StreamerCallbackArgs<N, K>) => void): (() => void) =>
		sdk.stream(streamName, [eventName], callback).stop;

const writeStream = <N extends StreamNames, K extends StreamKeys<N>>(streamName: N, streamKey: K, ...args: StreamerCallbackArgs<N, K>) =>
	sdk.publish(streamName, [streamKey, ...args]);

const disconnect = sdkTransportEnabled
	? () => {
			Meteor.disconnect();
			try {
				getDdpSdk().connection.close();
			} catch {
				// no-op — DDPSDK may not be connected yet
			}
		}
	: () => Meteor.disconnect();

const reconnect = sdkTransportEnabled
	? () => {
			Meteor.reconnect();
			// ensureConnectedAndAuthenticated handles both 'connect' and loginWithToken,
			// so reconnecting here also re-establishes the DDPSDK session with the
			// same token Meteor resumes with.
			void ensureConnectedAndAuthenticated();
		}
	: () => Meteor.reconnect();

// With SDK transport on, combine Meteor's DDP status with DDPSDK's so the
// ConnectionStatusBar / idle-connection hooks reflect the worst-case of both
// transports. With the flag off, route status straight through Meteor —
// Meteor.status() is already Tracker-reactive, so adding a second dependency
// via the meteor-backed proxy's emitter would just double-fire the autorun.
const ddpSdkStatusDep = sdkTransportEnabled ? new Tracker.Dependency() : undefined;
if (sdkTransportEnabled) {
	getDdpSdk().connection.on('connection', () => ddpSdkStatusDep!.changed());
}

type CombinedStatus = ReturnType<typeof Meteor.status>;

const sdkStatusToMeteor = (sdkStatus: string, meteor: CombinedStatus): CombinedStatus => {
	const retry = { retryCount: meteor.retryCount, retryTime: meteor.retryTime };

	switch (sdkStatus) {
		case 'connected':
			return { status: 'connected', connected: true, ...retry };
		case 'connecting':
			return { status: 'connecting', connected: false, ...retry };
		case 'reconnecting':
			return { status: 'connecting', connected: false, ...retry };
		case 'failed':
			return { status: 'failed', connected: false, ...retry };
		case 'closed':
		case 'disconnected':
			return { status: 'waiting', connected: false, ...retry };
		case 'idle':
		default:
			return { status: 'offline', connected: false, ...retry };
	}
};

const getStatus = sdkTransportEnabled
	? () => {
			ddpSdkStatusDep!.depend();
			return sdkStatusToMeteor(getDdpSdk().connection.status, Meteor.status());
		}
	: // useReactiveValue stores the snapshot in useSyncExternalStore, which
		// compares by identity. Meteor.status() reuses the same internal object
		// (mutated in place), so without spreading the snapshot reference never
		// changes and ConnectionStatusBar stops re-rendering on connect/drop.
		() => ({ ...Meteor.status() });

type ServerProviderProps = { children?: ReactNode };

const ServerProvider = ({ children }: ServerProviderProps) => {
	const { connected, status, retryCount, retryTime } = useReactiveValue(getStatus);

	const value = useMemo(
		(): ServerContextValue => ({
			connected,
			status,
			retryCount,
			retryTime,
			info,
			absoluteUrl,
			callMethod,
			callEndpoint,
			uploadToEndpoint,
			getStream,
			writeStream,
			disconnect,
			reconnect,
		}),
		[connected, retryCount, retryTime, status],
	);

	return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>;
};

export default ServerProvider;
