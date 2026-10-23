// The login lifecycle on top of DDPSDK, with no accounts-base underneath.
import { create } from 'zustand';

import { callMethod } from './connection';
import { isLoginTokenRefused } from '../lib/isLoginTokenRefused';
import { adoptAccountFromMeteorLoginResult, getDdpSdk } from '../lib/sdk/ddpSdk';
import { STORAGE_KEYS, getStoredItem, removeStoredItem, setStoredItem } from '../lib/sdk/storage';
import { userIdStore } from '../lib/user';

type LoginResult = { id: string; token: string; tokenExpires?: Date | { $date: number } };

type LoginWithFn = (...args: any[]) => void;

const loggingIn = create<boolean>(() => false);

let pendingLogins = 0;

let lastPolledLoginToken: string | null = null;

const MIN_RESUME_RETRY_DELAY = 1000;
const MAX_RESUME_RETRY_DELAY = 60_000;

let resumeRetryDelay = MIN_RESUME_RETRY_DELAY;

// Spreads the retries of clients that failed at the same moment, such as every client of a server being redeployed.
const withJitter = (delay: number): number => delay / 2 + Math.random() * (delay / 2);

let resumeRetryTimer: ReturnType<typeof setTimeout> | undefined;

const CONNECTION_TIMEOUT = 30_000;

// Every outcome settles the wait, so a connection that never comes back fails the login instead of holding it open.
const waitForConnection = async (): Promise<void> => {
	const { connection } = getDdpSdk();
	if (connection.status === 'connected') return;

	const cleanups: (() => void)[] = [];
	try {
		await new Promise<void>((resolve, reject) => {
			cleanups.push(connection.on('connected', () => resolve()));
			cleanups.push(connection.on('close', () => reject(new Error('The server connection was closed'))));

			const timer = setTimeout(() => reject(new Error('Timed out waiting for the server connection')), CONNECTION_TIMEOUT);
			cleanups.push(() => clearTimeout(timer));

			// A socket that already gave up would never connect again on its own.
			if (connection.status !== 'connecting' && connection.status !== 'reconnecting') {
				connection.connect().catch(reject);
			}
		});
	} finally {
		cleanups.forEach((cleanup) => cleanup());
	}
};

const makeClientLoggedIn = (result: LoginResult): void => {
	const tokenExpires =
		result.tokenExpires instanceof Date ? result.tokenExpires : result.tokenExpires && new Date(result.tokenExpires.$date);

	setStoredItem(STORAGE_KEYS.USER_ID, result.id);
	setStoredItem(STORAGE_KEYS.LOGIN_TOKEN, result.token);
	// Without an expiry from the server there is nothing to check on the next load.
	if (tokenExpires) {
		setStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES, tokenExpires.toString());
	} else {
		removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES);
	}
	lastPolledLoginToken = result.token;
	clearTimeout(resumeRetryTimer);
	resumeRetryDelay = MIN_RESUME_RETRY_DELAY;

	// The app's user is set first so onLogin listeners already read it.
	userIdStore.setState(result.id);
	adoptAccountFromMeteorLoginResult(result);
};

const makeClientLoggedOut = (): void => {
	clearTimeout(resumeRetryTimer);
	removeStoredItem(STORAGE_KEYS.USER_ID);
	removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
	removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES);
	lastPolledLoginToken = null;

	const sdk = getDdpSdk();
	sdk.account.clearCredentials();
	userIdStore.setState(undefined);

	// Clearing the user tears the authenticated socket down; the logged-out UI still needs one.
	if (sdk.connection.status !== 'connected' && sdk.connection.status !== 'connecting') {
		void sdk.connection.connect().catch((error) => console.warn('[accounts] reconnect after logout failed', error));
	}
};

export const callLoginMethod = async ({
	methodName = 'login',
	methodArguments = [{}],
}: {
	methodName?: string;
	methodArguments?: unknown[];
}): Promise<void> => {
	pendingLogins++;
	loggingIn.setState(true);
	try {
		const [credentials] = methodArguments as [{ resume?: string } | undefined];
		// ddp-streamer only accepts resume logins on the socket, so credentials go through the REST method bridge and
		// the token it returns authenticates the socket.
		const resumeToken = credentials?.resume ?? ((await callMethod(methodName, ...methodArguments)) as LoginResult | undefined)?.token;
		if (!resumeToken) {
			throw new Error(`No result from call to ${methodName}`);
		}

		await waitForConnection();
		const result = (await getDdpSdk().client.callAsyncWithOptions('login', { wait: true }, { resume: resumeToken })) as LoginResult;
		if (!result?.id || !result.token) {
			throw new Error(`No result from call to ${methodName}`);
		}
		makeClientLoggedIn(result);
	} finally {
		pendingLogins--;
		loggingIn.setState(pendingLogins > 0);
	}
};

export const loginWithToken = (token: string) => callLoginMethod({ methodArguments: [{ resume: token }] });

/**
 * Logs in with a stored token. The session only ends when the server refuses the token; after any other failure the
 * token is kept and the login retried with a backoff. Rejects with the error of the attempt either way.
 */
export const resumeStoredSession = async (token: string): Promise<void> => {
	clearTimeout(resumeRetryTimer);
	try {
		await loginWithToken(token);
	} catch (error) {
		// Another login or logout replaced the token while this one was in flight.
		if (getStoredItem(STORAGE_KEYS.LOGIN_TOKEN) !== token) {
			throw error;
		}

		if (isLoginTokenRefused(error)) {
			makeClientLoggedOut();
			throw error;
		}

		console.warn('[accounts] kept the session after a login failure that does not refuse the token', error);
		clearTimeout(resumeRetryTimer);
		resumeRetryTimer = setTimeout(() => {
			resumeRetryDelay = Math.min(resumeRetryDelay * 2, MAX_RESUME_RETRY_DELAY);
			// Only the session that failed is retried; a newer login or a logout supersedes it.
			if (getStoredItem(STORAGE_KEYS.LOGIN_TOKEN) !== token) return;
			void resumeStoredSession(token).catch(() => undefined);
		}, withJitter(resumeRetryDelay));
		throw error;
	}
};

/** Ends the session on this client only, keeping a connection for the logged-out UI. */
export const clearLocalSession = (): void => makeClientLoggedOut();

const loginWithMethods = new Map<string, LoginWithFn>();

export const registerLoginWithMethod = (name: `loginWith${string}`, method: LoginWithFn): void => {
	loginWithMethods.set(name, method);
};

export const getLoginWithMethod = (name: string): LoginWithFn | undefined => loginWithMethods.get(name);

export const logout = async (): Promise<void> => {
	try {
		await getDdpSdk().client.callAsyncWithOptions('logout', { wait: true });
	} finally {
		makeClientLoggedOut();
	}
};

export const setConnectionUserId = (userId: string | null): void => {
	if (!userId) {
		getDdpSdk().account.clearCredentials();
	}
	userIdStore.setState(userId ?? undefined);
};

export const subscribeLoggingIn = (cb: () => void): (() => void) => loggingIn.subscribe(cb);

export const isLoggingIn = (): boolean => loggingIn.getState();

// Email verification links arrive as `#/verify-email/<token>`, the format accounts-base parsed on page load.
const verifyEmailToken = window.location.hash.match(/^#\/verify-email\/(.*)$/)?.[1];
if (verifyEmailToken) {
	window.location.hash = '';
}

export const onEmailVerificationLink = (fn: (token: string) => void): void => {
	if (verifyEmailToken) {
		queueMicrotask(() => fn(verifyEmailToken));
	}
};

type PageLoadLoginAttempt = { type: 'resume'; allowed: boolean; error?: unknown; methodName: 'login'; methodArguments: unknown[] };

let pageLoadLoginAttempt: PageLoadLoginAttempt | undefined;
const pageLoadLoginCallbacks = new Set<(attempt: PageLoadLoginAttempt) => void>();

export const onPageLoadLogin = (fn: (loginAttempt: PageLoadLoginAttempt) => void): void => {
	if (pageLoadLoginAttempt) {
		fn(pageLoadLoginAttempt);
		return;
	}
	pageLoadLoginCallbacks.add(fn);
};

const settlePageLoadLogin = (attempt: PageLoadLoginAttempt): void => {
	pageLoadLoginAttempt = attempt;
	pageLoadLoginCallbacks.forEach((callback) => callback(attempt));
	pageLoadLoginCallbacks.clear();
};

// A stored session past its expiry is logged out on load instead of resumed, as accounts-base did.
const storedTokenExpires = getStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES);
if (storedTokenExpires && new Date(storedTokenExpires).getTime() <= Date.now()) {
	removeStoredItem(STORAGE_KEYS.USER_ID);
	removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
	removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES);
}

// Follows a session another tab logged in or out, as accounts-base's storage poller did.
lastPolledLoginToken = getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
setInterval(() => {
	const token = getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
	if (token === lastPolledLoginToken || loggingIn.getState()) return;

	lastPolledLoginToken = token;
	if (!token) {
		makeClientLoggedOut();
		return;
	}

	resumeStoredSession(token).catch(() => undefined);
}, 3000);

window.__rocketChatLoginWithToken = loginWithToken;

// Resumes the stored session once every module has loaded, as accounts-base did at package load.
queueMicrotask(() => {
	const token = getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
	if (!token) return;

	const methodArguments = [{ resume: token }];
	resumeStoredSession(token).then(
		() => settlePageLoadLogin({ type: 'resume', allowed: true, methodName: 'login', methodArguments }),
		(error) => settlePageLoadLogin({ type: 'resume', allowed: false, error, methodName: 'login', methodArguments }),
	);
});
