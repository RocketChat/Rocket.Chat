declare module 'meteor/meteor' {
	namespace Meteor {
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
				allowConnection: (allow: boolean) => void;
			};

			onMessage(message: string): void;
		}

		const connection: IMeteorConnection;

		function _relativeToSiteRootUrl(path: string): void;
		const _localStorage: Window['localStorage'];
	}
}
