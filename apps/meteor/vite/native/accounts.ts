// Vite-build implementation of client/meteor/accounts.ts: the login lifecycle
// on top of DDPSDK, with no accounts-base underneath.
import { create } from 'zustand';

import { adoptAccountFromMeteorLoginResult, getDdpSdk } from '../../client/lib/sdk/ddpSdk';
import { STORAGE_KEYS, getStoredItem, removeStoredItem, setStoredItem } from '../../client/lib/sdk/storage';
import { userIdStore } from '../../client/lib/user';
import { callMethod } from '../../client/meteor/connection';

type LoginResult = { id: string; token: string; tokenExpires?: Date | { $date: number } };

type LoginWithFn = (...args: any[]) => void;

const loggingIn = create<boolean>(() => false);

const waitForConnection = async (): Promise<void> => {
	const { connection } = getDdpSdk();
	if (connection.status === 'connected') return;

	await new Promise<void>((resolve) => {
		const stop = connection.on('connected', () => {
			stop();
			resolve();
		});
	});
};

const makeClientLoggedIn = (result: LoginResult): void => {
	const tokenExpires = result.tokenExpires instanceof Date ? result.tokenExpires : new Date(result.tokenExpires?.$date ?? Date.now());

	setStoredItem(STORAGE_KEYS.USER_ID, result.id);
	setStoredItem(STORAGE_KEYS.LOGIN_TOKEN, result.token);
	setStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES, tokenExpires.toString());

	adoptAccountFromMeteorLoginResult(result);
	userIdStore.setState(result.id);
};

const makeClientLoggedOut = (): void => {
	removeStoredItem(STORAGE_KEYS.USER_ID);
	removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
	removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES);

	const sdk = getDdpSdk();
	sdk.account.user = undefined;
	sdk.account.uid = undefined;
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
		loggingIn.setState(false);
	}
};

export const loginWithToken = (token: string) => callLoginMethod({ methodArguments: [{ resume: token }] });

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
		const { account } = getDdpSdk();
		account.user = undefined;
		account.uid = undefined;
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

// Resumes the stored session once every module has loaded, as accounts-base did at package load.
queueMicrotask(() => {
	const token = getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
	if (!token) return;

	const methodArguments = [{ resume: token }];
	loginWithToken(token).then(
		() => settlePageLoadLogin({ type: 'resume', allowed: true, methodName: 'login', methodArguments }),
		(error) => {
			console.warn('[accounts] resume login failed', error);
			makeClientLoggedOut();
			settlePageLoadLogin({ type: 'resume', allowed: false, error, methodName: 'login', methodArguments });
		},
	);
});
