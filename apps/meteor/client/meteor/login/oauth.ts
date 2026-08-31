import { Base64 } from '@rocket.chat/base64';
import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { Reload } from 'meteor/reload';

import { LoginCancelledError } from './LoginCancelledError';
import type { IOAuthProvider, LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import type { AbsoluteUrlOptions } from '../../lib/absoluteUrl';
import { absoluteUrl } from '../../lib/absoluteUrl';
import { loginServices } from '../../lib/loginServices';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';
import { settings } from '../../lib/settings';

const isLoginCancelledError = (error: unknown): error is Meteor.Error =>
	error instanceof Meteor.Error && error.error === LoginCancelledError.numericError;

export const convertError = <T>(error: T): LoginCancelledError | T => {
	if (isLoginCancelledError(error)) {
		return new LoginCancelledError(error.reason);
	}

	return error;
};

let lastCredentialToken: string | null = null;
let lastCredentialSecret: string | null | undefined = null;

const meteorOAuthRetrieveCredentialSecret = OAuth._retrieveCredentialSecret;
OAuth._retrieveCredentialSecret = (credentialToken: string): string | null => {
	let secret = meteorOAuthRetrieveCredentialSecret.call(OAuth, credentialToken);
	if (!secret) {
		const localStorageKey = `${OAuth._storageTokenPrefix}${credentialToken}`;
		secret = localStorage.getItem(localStorageKey);
		localStorage.removeItem(localStorageKey);
	}

	return secret;
};

const tryLoginAfterPopupClosed = (
	credentialToken: string,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
	totpCode?: string,
	credentialSecret?: string | null,
) => {
	credentialSecret = credentialSecret || OAuth._retrieveCredentialSecret(credentialToken) || null;
	const methodArgument = {
		oauth: {
			credentialToken,
			credentialSecret,
		},
		...(typeof totpCode === 'string' &&
			!!totpCode && {
				totp: {
					code: totpCode,
				},
			}),
	};

	lastCredentialToken = credentialToken;
	lastCredentialSecret = credentialSecret;

	if (typeof totpCode === 'string' && !!totpCode) {
		methodArgument.totp = {
			code: totpCode,
		};
	}

	Accounts.callLoginMethod({
		methodArguments: [methodArgument],
		userCallback: (err) => {
			callback?.(convertError(err));
		},
	});
};

export const credentialRequestCompleteHandler =
	(callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void, totpCode?: string) =>
	(credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => {
		if (!credentialTokenOrError) {
			callback?.(new Meteor.Error('No credential token passed'));
			return;
		}

		if (credentialTokenOrError instanceof Error) {
			callback?.(credentialTokenOrError);
			return;
		}

		tryLoginAfterPopupClosed(credentialTokenOrError, callback, totpCode);
	};

export const createOAuthTotpLoginMethod =
	<TOptions extends Meteor.LoginWithExternalServiceOptions>(provider: IOAuthProvider) =>
	(options: TOptions, code: string, callback?: LoginCallback) => {
		if (lastCredentialToken && lastCredentialSecret) {
			tryLoginAfterPopupClosed(lastCredentialToken, callback, code, lastCredentialSecret);
		} else {
			const credentialRequestCompleteCallback = credentialRequestCompleteHandler(callback, code);
			provider.requestCredential(options, credentialRequestCompleteCallback);
		}

		lastCredentialToken = null;
		lastCredentialSecret = null;
	};

Accounts.oauth.credentialRequestCompleteHandler = credentialRequestCompleteHandler;

getDdpSdk().account.onPageLoadLogin(async (loginAttempt: any) => {
	if (loginAttempt?.error?.error !== 'totp-required') {
		return;
	}

	const { methodArguments } = loginAttempt;
	if (!methodArguments?.length) {
		return;
	}

	const oAuthArgs = methodArguments.find((arg: any) => arg.oauth);
	const { credentialToken, credentialSecret } = oAuthArgs.oauth;
	const cb = loginAttempt.userCallback;

	const { process2faReturn } = await import('../../lib/2fa/process2faReturn');

	await process2faReturn({
		error: loginAttempt.error,
		originalCallback: cb,
		onCode: (code) => {
			tryLoginAfterPopupClosed(credentialToken, cb, code, credentialSecret);
		},
		emailOrUsername: undefined,
		result: undefined,
	});
});

type RequestCredentialConfig<
	T extends Partial<OAuthConfiguration>,
	TOptions extends LoginWithExternalServiceOptions = LoginWithExternalServiceOptions,
> = {
	config: T;
	loginStyle: string;
	options: TOptions;
	credentialRequestCompleteCallback: RequestCredentialCallback;
};

type RequestCredentialCallback = (credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => void;

export function wrapRequestCredentialFn<
	T extends Partial<OAuthConfiguration>,
	TOptions extends LoginWithExternalServiceOptions = LoginWithExternalServiceOptions,
>(serviceName: string, fn: (params: RequestCredentialConfig<T, TOptions>) => void) {
	return (options: TOptions, credentialRequestCompleteCallback: RequestCredentialCallback) => {
		loginServices.loadLoginService<T>(serviceName).then(
			(config) => {
				if (!config) {
					credentialRequestCompleteCallback?.(new Accounts.ConfigError());
					return;
				}

				const loginStyle = OAuth._loginStyle(serviceName, config, options);
				fn({
					config,
					loginStyle,
					options,
					credentialRequestCompleteCallback,
				});
			},
			() => {
				credentialRequestCompleteCallback?.(new Accounts.ConfigError());
			},
		);
	};
}

const openCenteredPopup = (url: string, width: number, height: number) => {
	const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
	const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
	const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth;
	const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.body.clientHeight - 22;
	// XXX what is the 22?
	// Use `outerWidth - width` and `outerHeight - height` for help in
	// positioning the popup centered relative to the current window
	const left = screenX + (outerWidth - width) / 2;
	const top = screenY + (outerHeight - height) / 2;

	const newwindow = window.open(url, 'Login', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`);

	if (!newwindow || newwindow.closed) {
		// blocked by a popup blocker maybe?
		const err = new Error('The login popup was blocked by the browser');
		Object.assign(err, { attemptedUrl: url });
		throw err;
	}

	if (newwindow.focus) newwindow.focus();

	return newwindow;
};

const showPopup = (
	url: string,
	callback: (credentialTokenOrError?: string | Error) => void,
	dimensions?: {
		width?: number;
		height?: number;
	},
) => {
	// default dimensions that worked well for facebook and google
	const popup = openCenteredPopup(url, dimensions?.width || 650, dimensions?.height || 331);

	const checkPopupOpen = setInterval(() => {
		let popupClosed;
		try {
			popupClosed = popup.closed || popup.closed === undefined;
		} catch (e) {
			return;
		}

		if (popupClosed) {
			clearInterval(checkPopupOpen);
			callback();
		}
	}, 100);
};

const saveDataForRedirect = (loginService: string, credentialToken: string) => {
	Reload._onMigrate('oauth', () => [true, { loginService, credentialToken }]);
	Reload._migrate(null, { immediateMigration: true });
};

export function launchLogin({
	loginService,
	loginStyle,
	loginUrl,
	popupOptions,
	credentialToken,
	credentialRequestCompleteCallback,
}: {
	loginService: string;
	loginStyle: string;
	loginUrl: URL;
	popupOptions?: {
		width?: number;
		height?: number;
	};
	credentialToken: string;
	credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void;
}): void {
	// Settings might not be loaded yet; in that case, just skip the proxying
	const proxiedServices = settings.peek<string>('Accounts_OAuth_Proxy_services')?.replace(/\s/g, '').split(',') ?? [];
	const proxyHost = settings.peek<string>('Accounts_OAuth_Proxy_host');

	if (proxyHost && proxiedServices.includes(loginService)) {
		const redirectUri = loginUrl.searchParams.get('redirect_uri');
		loginUrl.searchParams.set('redirect_uri', `${proxyHost}/oauth_redirect`);
		loginUrl.searchParams.set('state', `${redirectUri}!${loginUrl.searchParams.get('state')}`);
		loginUrl = new URL(`${proxyHost}/redirect/${encodeURIComponent(loginUrl.toString())}`);
	}

	if (!loginService) throw new Error('loginService required');
	if (loginStyle === 'popup') {
		showPopup(loginUrl.toString(), credentialRequestCompleteCallback.bind(null, credentialToken), popupOptions);
	} else if (loginStyle === 'redirect') {
		saveDataForRedirect(loginService, credentialToken);
		window.location.href = loginUrl.toString();
	} else {
		throw new Error('invalid login style');
	}
}

export const redirectUri = (
	serviceName: string,
	config?: { loginStyle?: string },
	params?: Record<string, any>,
	absoluteUrlOptions?: AbsoluteUrlOptions,
): string => {
	const url = new URL(absoluteUrl(`_oauth/${serviceName}`, absoluteUrlOptions));

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
	}

	// DEPRECATED: Remove in v5.0.0
	// Meteor 2.3 removed ?close from redirect uri so we need to add it back to not break old oauth clients
	// https://github.com/meteor/meteor/commit/b5b7306bedc3e8eb241e64efb1e281925aa75dd3#diff-59244f4e0176cb1beed2e287924e97dc7ae2c0cc51494ce121a85d8937d116a5L11
	if (!config?.loginStyle && !url.searchParams.has('close')) {
		console.warn(
			`Automatically added ?close to 'redirect_uri' for ${serviceName}, this behavior will be removed in v5.0.0.\n` +
				"Please update your OAuth config to accept both with and without ?close as the 'redirect_uri'.",
		);
		url.searchParams.set('close', '');
	}

	return url.toString();
};

export const stateParam = (loginStyle: string, credentialToken: string, redirectUrl?: string) => {
	const state: Record<string, string> = {
		loginStyle,
		credentialToken,
	};

	if (loginStyle === 'redirect') {
		state.redirectUrl = redirectUrl || `${window.location}`;
	}

	// Encode base64 as not all login services URI-encode the state
	// parameter when they pass it back to us.
	// Use the 'base64' package here because 'btoa' isn't supported in IE8/9.
	return Base64.encode(JSON.stringify(state));
};
