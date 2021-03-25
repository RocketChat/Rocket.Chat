declare module 'meteor/meteor' {
	import { EJSON } from 'meteor/ejson';

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

			onMessage(message: string): void;
		}

		const connection: IMeteorConnection;
	}
}
