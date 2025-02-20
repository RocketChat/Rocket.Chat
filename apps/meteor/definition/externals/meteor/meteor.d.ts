import 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import type { IStreamerConstructor, IStreamer } from 'meteor/rocketchat:streamer';

type StringifyBuffers<T extends unknown[]> = {
	[P in keyof T]: T[P] extends Buffer ? string : T[P];
};

declare global {
	namespace Assets {
		function getBinaryAsync(assetPath: string): Promise<EJSON | undefined>;

		function getTextAsync(assetPath: string): Promise<string | undefined>;
	}
}

declare module 'meteor/meteor' {
	namespace Meteor {
		const Streamer: IStreamerConstructor & IStreamer;

		namespace StreamerCentral {
			const instances: {
				[name: string]: IStreamer;
			};

			function on(name: string, callback: (...args: any[]) => void): void;
		}

		interface ErrorStatic {
			new (error: string | number, reason?: string, details?: any): Error;
		}

		interface Error extends globalThis.Error {
			error: string | number;
			reason?: string;
		}

		interface Device {
			isDesktop: () => boolean;
		}

		const server: any;

		const runAsUser: <T>(userId: string, scope: () => T) => T;

		interface MethodThisType {
			twoFactorChecked: boolean | undefined;
		}

		interface IDDPMessage {
			msg: 'method';
			method: string;
			params: EJSON[];
			id: string;
		}

		interface IDDPUpdatedMessage {
			msg: 'updated';
			methods: string[];
		}

		interface IMeteorConnection {
			httpHeaders: Record<string, any>;
			referer: string;
			clientAddress: string;
			_send(message: IDDPMessage): void;

			_methodInvokers: Record<string, any>;

			_livedata_data(message: IDDPUpdatedMessage): void;

			_stream: {
				eventCallbacks: {
					message: Array<(data: string) => void>;
				};
				socket: {
					onmessage: (data: { type: string; data: string }) => void;
					_didMessage: (data: string) => void;
					send: (data: string) => void;
				};
				_launchConnectionAsync: () => void;
				allowConnection: () => void;
				on: (key: 'message', callback: (data: string) => void) => void;
			};

			_outstandingMethodBlocks: unknown[];

			// Updated: onMessage is now inside _streamHandlers
			_streamHandlers: {
				onMessage(message: string): void;
				onReset(): void;
			};

			status(): {
				connected: boolean;
				retryCount?: number;
				retryTime?: number;
				status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline';
				reconnect: () => void;
			};

			subscribe(
				id: string,
				name: string,
				...args: [
					...unknown,
					callbacks?: {
						onReady?: (...args: any[]) => void;
						onStop?: (error?: Error) => void;
						onError?: (error: Error) => void;
					},
				]
			): SubscriptionHandle;
		}

		const connection: IMeteorConnection;

		function _relativeToSiteRootUrl(path: string): string;
		const _localStorage: Window['localStorage'];

		function methods<TServerMethods extends ServerMethods>(methods: {
			[TMethodName in keyof TServerMethods]?: (
				this: MethodThisType,
				...args: StringifyBuffers<Parameters<TServerMethods[TMethodName]>>
			) => ReturnType<TServerMethods[TMethodName]> | Promise<ReturnType<TServerMethods[TMethodName]>>;
		}): void;

		const AppCache:
			| {
					config: (config: { onlineOnly: string[] }) => void;
			  }
			| undefined;
	}

	// eslint-disable-next-line no-var
	var Meteor: {
		[key: `loginWith${string}`]: any;
	};
}
