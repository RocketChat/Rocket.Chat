/* eslint-disable @typescript-eslint/camelcase */
import { EJSON } from 'meteor/ejson';

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

			_livedata_data(message: IDDPUpdatedMessage): void;

			_stream: {
				eventCallbacks: {
					message: Array<(data: string) => void>;
				};
				socket: {
					onmessage: (data: {type: string; data: string}) => void;
					_didMessage: (data: string) => void;
					send: (data: string) => void;
				};
				_launchConnectionAsync: () => void;
			};

			onMessage(message: string): void;
		}

		const connection: IMeteorConnection;
	}
}

declare module 'meteor/tracker' {
	namespace Tracker {
		function nonreactive<T>(func: () => T): T;
	}
}

declare module 'meteor/mongo' {
	namespace Mongo {
		// eslint-disable-next-line @typescript-eslint/interface-name-prefix
		interface CollectionStatic {
			new <T>(name: string | null, options?: {
				connection?: object | null;
				idGeneration?: string;
				transform?: Function | null;
			}): Collection<T>;
		}
	}
}
