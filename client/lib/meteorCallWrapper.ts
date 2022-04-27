import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { APIClient } from '../../app/utils/client';

const bypassMethods: string[] = ['setUserStatus', 'logout'];

function shouldBypass({ method, params }: Meteor.IDDPMessage): boolean {
	if (method === 'login' && params[0]?.resume) {
		return true;
	}

	if (method.startsWith('UserPresence:') || bypassMethods.includes(method)) {
		return true;
	}

	if (method.startsWith('stream-')) {
		return true;
	}

	return false;
}

function wrapMeteorDDPCalls(): void {
	const { _send } = Meteor.connection;

	Meteor.connection._send = function _DDPSendOverREST(message): void {
		if (message.msg !== 'method' || shouldBypass(message)) {
			return _send.call(Meteor.connection, message);
		}

		const endpoint = Tracker.nonreactive(() => (!Meteor.userId() ? 'method.callAnon' : 'method.call'));

		const restParams = {
			message: DDPCommon.stringifyDDP({ ...message }),
		};

		const processResult = (_message: any): void => {
			// Prevent error on reconnections and method retry.
			// On those cases the API will be called 2 times but
			// the handler will be deleted after the first execution.
			if (!Meteor.connection._methodInvokers[message.id]) {
				return;
			}
			Meteor.connection._livedata_data({
				msg: 'updated',
				methods: [message.id],
			});
			Meteor.connection.onMessage(_message);
		};

		APIClient.v1
			.post(`${endpoint}/${encodeURIComponent(message.method.replace(/\//g, ':'))}`, restParams)
			.then(({ message: _message }) => {
				processResult(_message);
				if (message.method === 'login') {
					const parsedMessage = DDPCommon.parseDDP(_message) as { result?: { token?: string } };
					if (parsedMessage.result?.token) {
						Meteor.loginWithToken(parsedMessage.result.token);
					}
				}
			})
			.catch((error) => {
				console.error(error);
			});
	};
}

window.USE_REST_FOR_DDP_CALLS && wrapMeteorDDPCalls();
