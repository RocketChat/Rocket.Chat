// Single point of access to Meteor accounts-base's login lifecycle on the
// client. Call sites outside client/meteor go through these helpers so the
// eventual SDK-native auth replaces one module instead of every caller.
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

export const callLoginMethod = (options: Omit<Accounts.LoginMethodOptions, 'userCallback'>) =>
	new Promise<void>((resolve, reject) => {
		Accounts.callLoginMethod({
			...options,
			userCallback: (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			},
		});
	});

export const loginWithToken = (token: string) =>
	new Promise<void>((resolve, reject) => {
		Meteor.loginWithToken(token, (error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});

type LoginWithFn = (...args: any[]) => void;

export const registerLoginWithMethod = (name: `loginWith${string}`, method: LoginWithFn): void => {
	(Meteor as unknown as Record<string, unknown>)[name] = method;
};

/** Resolves a `Meteor.loginWith<Service>` method registered by client/meteor/login */
export const getLoginWithMethod = (name: string): LoginWithFn | undefined => {
	const method = (Meteor as unknown as Record<string, unknown>)[name];
	return typeof method === 'function' ? (method.bind(Meteor) as LoginWithFn) : undefined;
};

export const logout = () => Meteor.logout();

export const setConnectionUserId = (userId: string | null) => Meteor.connection.setUserId(userId);

export const onEmailVerificationLink = (fn: (token: string) => void) => Accounts.onEmailVerificationLink(fn);

export const onPageLoadLogin = (fn: (loginAttempt: unknown) => void) => Accounts.onPageLoadLogin(fn);

// Accounts.loggingIn() is Tracker-reactive; hooking `_setLoggingIn` (also
// touched by overrides/killMeteorStream.ts) fans transitions out to plain
// listeners without entering a Tracker computation.
const loggingInListeners = new Set<() => void>();
let loggingInBridgeInstalled = false;
const installLoggingInBridge = (): void => {
	if (loggingInBridgeInstalled) return;
	loggingInBridgeInstalled = true;
	const wrap = Accounts as unknown as { _setLoggingIn?: (v: boolean) => void };
	const original = wrap._setLoggingIn;
	if (typeof original !== 'function') return;
	wrap._setLoggingIn = function (this: typeof Accounts, v: boolean) {
		original.call(this, v);
		loggingInListeners.forEach((cb) => cb());
	};
};

export const subscribeLoggingIn = (cb: () => void): (() => void) => {
	installLoggingInBridge();
	loggingInListeners.add(cb);
	return () => {
		loggingInListeners.delete(cb);
	};
};

export const isLoggingIn = (): boolean => Accounts.loggingIn();
