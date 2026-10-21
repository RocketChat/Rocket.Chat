import { Accounts } from 'meteor/accounts-base';

import { isLoginTokenRefused } from '../../lib/isLoginTokenRefused';

// A failed session resume only logs the client out when the server refused the token; after any other failure the
// stored token is kept and the resume is retried.

type AccountsInternals = {
	makeClientLoggedOut(): Promise<void>;
	loginWithToken(token: string, callback: (error?: unknown) => void): void;
	_storedLoginToken(): string | null | undefined;
};

const accounts = Accounts as typeof Accounts & AccountsInternals;

const MIN_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 60_000;

let lastLoginFailure: unknown;
let retryDelay = MIN_RETRY_DELAY;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

const { makeClientLoggedOut, logout } = accounts;

// Spreads the retries of clients that failed at the same moment, such as every client of a server being redeployed.
const withJitter = (delay: number): number => delay / 2 + Math.random() * (delay / 2);

const retryResume = (token: string): void => {
	clearTimeout(retryTimer);
	retryTimer = setTimeout(() => {
		retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
		if (accounts._storedLoginToken() !== token) {
			return;
		}

		accounts.loginWithToken(token, (error) => {
			lastLoginFailure = undefined;
			if (!error) {
				return;
			}

			if (isLoginTokenRefused(error)) {
				void makeClientLoggedOut.call(accounts);
				return;
			}

			retryResume(token);
		});
	}, withJitter(retryDelay));
};

Accounts.onLoginFailure(({ error }: { error?: unknown }) => {
	lastLoginFailure = error;
});

Accounts.onLogin(() => {
	lastLoginFailure = undefined;
	retryDelay = MIN_RETRY_DELAY;
	clearTimeout(retryTimer);
});

accounts.makeClientLoggedOut = async function (this: typeof accounts) {
	const failure = lastLoginFailure;
	lastLoginFailure = undefined;

	const token = accounts._storedLoginToken();
	if (failure && token && !isLoginTokenRefused(failure)) {
		console.warn('[accounts] kept the session after a login failure that does not refuse the token', failure);
		retryResume(token);
		return;
	}

	clearTimeout(retryTimer);
	return makeClientLoggedOut.call(this);
};

// A logout the user asked for always goes through, whatever login failed before it.
accounts.logout = function (this: typeof accounts, ...args: Parameters<typeof logout>) {
	lastLoginFailure = undefined;
	return logout.apply(this, args);
};
