import { Meteor } from 'meteor/meteor';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { parseDDP, stringifyDDP } from '../../lib/sdk/ddpProtocol';
import { getUserId } from '../../lib/user';

const bypassMethods: string[] = ['setUserStatus', 'logout'];

const isResumeLogin = ({ method, params }: Meteor.IDDPMessage): boolean => method === 'login' && Boolean(params?.[0]?.resume);

const shouldBypass = ({ msg, method, params }: Meteor.IDDPMessage): boolean => {
	if (msg !== 'method') {
		return true;
	}

	// In microservices CI, ddp-streamer-service registers `login`, `logout`,
	// `setUserStatus`, and `UserPresence:*` as native methods (configureServer.ts
	// in ee/apps/ddp-streamer); every other method delegates to the Meteor
	// service via callMethodWithToken (extra hop). Bypassing these to Meteor's
	// own WS routes them straight to ddp-streamer for the fast path; routing
	// them through REST would wedge them on the slow rocketchat-main path
	// instead, blowing past the 5s `expect(...).toBeVisible()` timeouts the
	// post-relogin tests rely on.
	if (method === 'login' && params?.[0]?.resume) {
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

		const processResult = (resultMessage: string): void => {
			// Prevent error on reconnections and method retry: on those cases the
			// API will be called twice but the handler is deleted after the first
			// execution.
			if (!this._methodInvokers[message.id]) {
				return;
			}
			this._livedata_data({
				msg: 'updated',
				methods: [message.id],
			});
			this._streamHandlers.onMessage(resultMessage);
		};

		const wasResumeLogin = isResumeLogin(message);

		// Note on login routing: `login + resume` is bypassed in shouldBypass
		// (handled by Meteor's own WS → ddp-streamer's native handler). Other
		// login flavours (SAML credential exchange, password, OAuth) MUST route
		// through REST below — never through the DDPSDK socket. ddp-streamer
		// only exposes `login` natively for the resume shape; non-resume logins
		// get delegated via MeteorService.callMethodWithToken (extra hop), and
		// the SDK socket would also race the follow-up `Meteor.loginWithToken`
		// resume that gets queued from the success handler — two logins on
		// different sockets for the same user, with diverging account state.
		// REST → rocketchat-main is one hop and lets the resume follow-up
		// settle the SDK auth via ensureConnectedAndAuthenticated.

		// Login itself is the call that establishes auth — running it through
		// `method.call` would force the REST middleware to validate the very
		// token we're trying to use, and the server would 401 with "You must
		// be logged in" before even invoking the login method. The 401 then
		// short-circuits the resume callback, leaving the stale token in
		// localStorage and the user wedged on /home with no main UI.
		const endpoint = !getUserId() || wasResumeLogin ? 'method.callAnon' : 'method.call';

		const restParams = {
			message: stringifyDDP({ ...message }),
		};

		const method = encodeURIComponent(message.method.replace(/\//g, ':'));

		sdk.rest
			.post(`/v1/${endpoint}/${method}`, restParams)
			.then(({ message: _message }) => {
				// Calling Meteor.loginWithToken before processing the result of the first login adds the new login request
				// to the top of the methodInvokers queue. The request itself only sends after the first login result is
				// processed, but the Accounts.onLogin callbacks fire before that follow-up request — so any requests
				// initiated inside onLogin callbacks queue behind the loginWithToken and only run after it completes.
				if (!wasResumeLogin && message.method === 'login') {
					const parsedMessage = parseDDP(_message) as { result?: { token?: string } };
					if (parsedMessage.result?.token) {
						Meteor.loginWithToken(parsedMessage.result.token);
					}
				}
				processResult(_message);
			})
			.catch((error: unknown) => {
				const e = (error ?? {}) as { error?: unknown; reason?: unknown; message?: unknown };

				// method.call / method.callAnon encode the original Meteor error
				// inside `body.message` as a DDP `result` frame (mountResult in
				// app/api/server/v1/misc.ts). Forward it untouched so the original
				// `error.error` survives — re-encoding strips codes like
				// `totp-required` and `withAsyncTOTP` (totpOnCall.ts) then fails to
				// open the 2FA modal.
				if (typeof e.message === 'string') {
					try {
						const parsed = parseDDP(e.message) as { msg?: string; id?: string };
						if (parsed?.msg === 'result' && parsed.id === message.id) {
							processResult(e.message);
							console.error(error);
							return;
						}
					} catch {
						// fall through to the synthetic frame below
					}
				}

				// Auth-middleware errors (e.g. 401) come as
				// { success: false, error, status, message } with `message` as a
				// plain string — not a DDP frame. Re-encode as a proper DDP error
				// result so Accounts' resume callback clears stale creds and the
				// user isn't wedged on /home with no main UI.
				const errorMessage = stringifyDDP({
					msg: 'result',
					id: message.id,
					error: {
						isClientSafe: true,
						error: e.error ?? 'unknown',
						reason: (e.reason as string) ?? (e.message as string) ?? 'Unknown error',
						message: (e.message as string) ?? (e.reason as string) ?? 'Unknown error',
						errorType: 'Meteor.Error',
					} as unknown as Meteor.Error,
				});
				processResult(errorMessage);
				console.error(error);
			});
	};
};

// Wrap `_send` unconditionally — develop already routed all non-bypassed
// methods (including user/password login) through REST. In MS the WS
// connects to `ddp-streamer-service`, whose native `login` handler only
// accepts `{ resume }` tokens and 403s everything else; routing login via
// REST hits `rocketchat-main` directly so the full
// `Accounts.registerLoginHandler` chain runs.
Meteor.connection._send = withDDPOverREST(Meteor.connection._send);
