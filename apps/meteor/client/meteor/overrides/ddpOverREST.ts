import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { adoptAccountFromMeteorLoginResult, getDdpSdk } from '../../lib/sdk/ddpSdk';
import { getUserId } from '../../lib/user';

const bypassMethods: string[] = [];

const isResumeLogin = ({ method, params }: Meteor.IDDPMessage): boolean => method === 'login' && Boolean(params?.[0]?.resume);

const shouldBypass = ({ msg, method }: Meteor.IDDPMessage): boolean => {
	if (msg !== 'method') {
		return true;
	}

	if (bypassMethods.includes(method)) {
		return true;
	}

	if (method.startsWith('stream-')) {
		return true;
	}

	return false;
};

/**
 * DDPSDK can route a method call only when its socket is BOTH connected AND
 * the underlying DDP session is authenticated (or the method itself is the
 * login that performs that authentication). After a fresh re-login (logout →
 * login), the SDK socket is reconnected before sdk.account.loginWithToken
 * lands, so its session is briefly unauthenticated. If we route cached-store
 * gets (`private-settings/get`, `permissions/get`, etc.) through the SDK in
 * that window, the server treats them as anonymous and returns []. The
 * cached store then persists those empty arrays and the admin UI shows "No
 * results found". REST is safe in that window because it auths each request
 * via X-User-Id / X-Auth-Token cookies, which the resume token populated.
 */
const isDdpSdkReady = (message: Meteor.IDDPMessage): boolean => {
	const sdk = getDdpSdk();
	if (sdk.connection.status !== 'connected') return false;
	if (sdk.account.uid) return true;
	// The login itself is the call that authenticates the socket — let it through.
	return message.method === 'login';
};

/**
 * Route Meteor.apply DDP method calls through our SDK when it is live; fall
 * back to REST when DDPSDK hasn't handshaken yet. The collection frames the
 * server pushes in response land on DDPSDK's socket, which the
 * ddpSdkCollectionBridge override re-feeds into
 * Meteor.connection._streamHandlers so the Mongo.Collection registry keeps
 * updating as the user logs in.
 */
const withDDPOverSDK = (_send: (this: Meteor.IMeteorConnection, message: Meteor.IDDPMessage, ...args: unknown[]) => void) => {
	return function _sendOverSDK(this: Meteor.IMeteorConnection, message: Meteor.IDDPMessage, ...args: unknown[]): void {
		if (shouldBypass(message)) {
			return _send.call(this, message, ...args);
		}

		const processResult = (resultMessage: string): void => {
			if (!this._methodInvokers[message.id]) {
				return;
			}
			this._livedata_data({
				msg: 'updated',
				methods: [message.id],
			});
			this._streamHandlers.onMessage(resultMessage);
		};

		if (isDdpSdkReady(message)) {
			const params = Array.isArray(message.params) ? message.params : [];
			const wasResumeLogin = isResumeLogin(message);
			getDdpSdk()
				.client.callAsync(message.method, ...params)
				.then((result: unknown) => {
					if (message.method === 'login') {
						// Sync DDPSDK's account state with the login result so a downstream
						// ensureConnectedAndAuthenticated call won't fire a second redundant
						// login on the same socket.
						adoptAccountFromMeteorLoginResult(result);
					}

					if (
						!wasResumeLogin &&
						message.method === 'login' &&
						typeof result === 'object' &&
						result !== null &&
						'token' in result &&
						typeof (result as { token?: unknown }).token === 'string'
					) {
						Meteor.loginWithToken((result as { token: string }).token);
					}

					const resultMessage = DDPCommon.stringifyDDP({ msg: 'result', id: message.id, result } as Parameters<
						typeof DDPCommon.stringifyDDP
					>[0]);
					processResult(resultMessage);
				})
				.catch((error: unknown) => {
					const errorMessage = DDPCommon.stringifyDDP({
						msg: 'result',
						id: message.id,
						error: error as Meteor.Error,
					});
					processResult(errorMessage);
					console.error(error);
				});
			return;
		}

		// Fallback: DDPSDK still connecting / offline. Use REST so early-boot
		// method calls (public settings, etc.) keep working.
		const endpoint = !getUserId() ? 'method.callAnon' : 'method.call';

		const restParams = {
			message: DDPCommon.stringifyDDP({ ...message }),
		};

		const method = encodeURIComponent(message.method.replace(/\//g, ':'));
		const wasResumeLogin = isResumeLogin(message);

		sdk.rest
			.post(`/v1/${endpoint}/${method}`, restParams)
			.then(({ message: _message }) => {
				// Skip Meteor.loginWithToken on resume responses: Meteor itself called
				// us with `login({resume})` and is already wiring up the new token via
				// its invoker. Calling loginWithToken again would re-enter this _send
				// override, dispatch another login method, and recurse — locking the
				// boot in a loop of resume calls and leaving Meteor.loggingIn() pinned
				// to true forever.
				if (!wasResumeLogin && message.method === 'login') {
					const parsedMessage = DDPCommon.parseDDP(_message) as { result?: { token?: string } };
					if (parsedMessage.result?.token) {
						Meteor.loginWithToken(parsedMessage.result.token);
					}
				}
				processResult(_message);
			})
			.catch(async (error) => {
				if ('message' in error && error.message) {
					processResult(error.message);
				}
				console.error(error);
			});
	};
};

Meteor.connection._send = withDDPOverSDK(Meteor.connection._send);
