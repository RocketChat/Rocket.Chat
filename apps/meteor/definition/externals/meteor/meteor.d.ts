import 'meteor/meteor';
import { IStreamerConstructor, IStreamer } from 'meteor/rocketchat:streamer';

declare module 'meteor/meteor' {
	namespace Meteor {
		const Streamer: IStreamerConstructor & IStreamer;

		namespace StreamerCentral {
			const instances: {
				[name: string]: IStreamer;
			};
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

		const runAsUser: (userId: string, scope: Function) => any;

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
			};

			onMessage(message: string): void;
		}

		const connection: IMeteorConnection;

		function _relativeToSiteRootUrl(path: string): string;
		const _localStorage: Window['localStorage'];
	}
}
