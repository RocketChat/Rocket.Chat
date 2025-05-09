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

const withDDPOverREST = (_send: (this: Meteor.IMeteorConnection, message: Meteor.IDDPMessage, ...args: unknown[]) => void) => {
	return function _sendOverREST(this: Meteor.IMeteorConnection, message: Meteor.IDDPMessage, ...args: unknown[]): void {
		if (shouldBypass(message)) {
			return _send.call(this, message, ...args);
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

			this._streamHandlers.onMessage(_message);
		};

		const method = encodeURIComponent(message.method.replace(/\//g, ':'));

		sdk.rest
			.post(`/v1/${endpoint}/${method}`, restParams)
			.then(({ message: _message }) => {
				// Calling Meteor.loginWithToken before processing the result of the first login will ensure that the new login request
				// is added to the top of the list of methodInvokers.
				// The request itself will only be sent after the first login result is processed, but
				// the Accounts.onLogin callbacks will be called before this request is effectively sent;
				// This way, any requests done inside of onLogin callbacks will be added to the list
				// and processed only after the Meteor.loginWithToken request is done
				// So, the effective order is:
				//   1. regular login with password is sent
				//   2. result of the password login is received
				//   3. login with token is added to the list of pending requests
				//   4. result of the password login is processed
				//   5. Accounts.onLogin callbacks are triggered, Meteor.userId is set
				//   6. the request for the login with token is effectively sent
				//   7. login with token result is processed
				//   8. requests initiated inside of the Accounts.onLogin callback are then finally sent
				//
				// Keep in mind that there's a difference in how meteor3 processes the request results, compared to older meteor versions
				// On meteor3, any collection writes triggered by a request result are done async, which means that the `processResult` call
				// will not immediatelly trigger the callbacks, like it used to in older versions.
				// That means that on meteor3+, it doesn't really make a difference if processResult is called before or after the Meteor.loginWithToken here
				// as the result will be processed async, the loginWithToken call will be initiated before it is effectively processed anyway.
				if (message.method === 'login') {
					const parsedMessage = DDPCommon.parseDDP(_message) as { result?: { token?: string } };
					if (parsedMessage.result?.token) {
						Meteor.loginWithToken(parsedMessage.result.token);
					}
				}

				processResult(_message);
			})
			.catch((error) => {
				console.error(error);
			});
	};
};

if (window.USE_REST_FOR_DDP_CALLS) {
	Meteor.connection._send = withDDPOverREST(Meteor.connection._send);
}
