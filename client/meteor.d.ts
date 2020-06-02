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

			onMessage(message: string): void;
		}

		const connection: IMeteorConnection;
	}
}
