/* eslint-disable @typescript-eslint/interface-name-prefix */
import 'meteor/meteor';

declare module 'meteor/meteor' {
	namespace Meteor {
		interface ErrorStatic {
			new (error: string | number, reason?: string, details?: any): Error;
		}

		interface Error extends globalThis.Error {
			error: string | number;
			reason?: string;
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

			// eslint-disable-next-line @typescript-eslint/camelcase
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
