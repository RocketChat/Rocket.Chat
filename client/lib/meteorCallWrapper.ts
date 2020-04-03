import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { DDPCommon } from 'meteor/ddp-common';

import { APIClient } from '../../app/utils/client';

function wrapMeteorDDPCalls(): void {
	const { _send } = Meteor.connection;

	Meteor.connection._send = function _DDPSendOverREST(message): void {
		if (message.msg !== 'method' || (message.method === 'login' && message.params[0]?.resume)) {
			return _send.call(Meteor.connection, message);
		}

		const endpoint = Tracker.nonreactive(() => (!Meteor.userId() ? 'method.callAnon' : 'method.call'));

		const restParams = {
			message: DDPCommon.stringifyDDP(message),
		};

		APIClient.v1.post(`${ endpoint }/${ encodeURIComponent(message.method) }`, restParams)
			.then(({ message: result }) => {
				Meteor.connection._livedata_data({
					msg: 'updated',
					methods: [message.id],
				});
				Meteor.connection.onMessage(result);
			})
			.catch((error) => {
				console.error(error);
			});
	};
}

window.USE_REST_FOR_DDP_CALLS && wrapMeteorDDPCalls();
