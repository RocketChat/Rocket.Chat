import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { sdk } from '../../app/utils/client/lib/SDKClient';

const bypassMethods: string[] = ['setUserStatus', 'logout'];

const shouldBypass = ({ msg, method, params }: Meteor.IDDPMessage): boolean => {
	if (msg !== 'method') {
		return true;
	}

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
};

const withDDPOverREST = (_send: (this: Meteor.IMeteorConnection, message: Meteor.IDDPMessage) => void) => {
	return function _sendOverREST(this: Meteor.IMeteorConnection, message: Meteor.IDDPMessage): void {
		if (shouldBypass(message)) {
			return _send.call(this, message);
		}

		const endpoint = Tracker.nonreactive(() => (!Meteor.userId() ? 'method.callAnon' : 'method.call'));

		const restParams = {
			message: DDPCommon.stringifyDDP({ ...message }),
		};

		const processResult = (_message: string): void => {
			// Prevent error on reconnections and method retry.
			// On those cases the API will be called 2 times but
			// the handler will be deleted after the first execution.
			if (!this._methodInvokers[message.id]) {
				return;
			}
			this._livedata_data({
				msg: 'updated',
				methods: [message.id],
			});
			this.onMessage(_message);
		};

		const method = encodeURIComponent(message.method.replace(/\//g, ':'));

		sdk.rest
			.post(`/v1/${endpoint}/${method}`, restParams)
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
};

if (window.USE_REST_FOR_DDP_CALLS) {
	Meteor.connection._send = withDDPOverREST(Meteor.connection._send);
}
