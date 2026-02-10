import { Base64 } from './base64.ts';
import { check } from './check.ts';
import { Meteor } from './meteor.ts';
import { Package } from './package-registry.ts';
import { Reload } from './reload.ts';
import { _constructUrl } from './url.ts';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type PopupDimensions = {
	width?: number;
	height?: number;
};

type OAuthLoginOptions = {
	loginService?: string;
	loginStyle?: 'popup' | 'redirect' | undefined;
	loginUrl: string;
	credentialRequestCompleteCallback?: ((token?: string | Error) => void) | undefined;
	credentialToken: string;
	popupOptions?: PopupDimensions;
	redirectUrl?: string;
};

type OAuthState = {
	loginStyle: 'popup' | 'redirect' | undefined;
	credentialToken: string;
	isCordova: boolean;
	redirectUrl?: string;
};

export type OAuthConfiguration = {
	loginStyle?: 'popup' | 'redirect';
	[key: string]: any;
};

// -----------------------------------------------------------------------------
// Module Scope Variables
// -----------------------------------------------------------------------------

const credentialSecrets: Record<string, string> = {};
const STORAGE_TOKEN_PREFIX = 'Meteor.oauth.credentialSecret-';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const openCenteredPopup = (url: string, width: number, height: number): Window | null => {
	const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
	const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
	const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth;
	const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.body.clientHeight - 22;

	const left = screenX + (outerWidth - width) / 2;
	const top = screenY + (outerHeight - height) / 2;

	const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`;
	const newwindow = window.open(url, 'Login', features);

	if (!newwindow || newwindow.closed) {
		const err: any = new Error('The login popup was blocked by the browser');
		err.attemptedUrl = url;
		throw err;
	}

	if (newwindow.focus) {
		newwindow.focus();
	}

	return newwindow;
};

// -----------------------------------------------------------------------------
// OAuth Implementation
// -----------------------------------------------------------------------------

export const OAuth = {
	_storageTokenPrefix: STORAGE_TOKEN_PREFIX,

	showPopup(url: string, callback: () => void, dimensions?: PopupDimensions) {
		const width = dimensions?.width || 650;
		const height = dimensions?.height || 331;

		const popup = openCenteredPopup(url, width, height);

		if (!popup) return;

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
	},

	_loginStyle(_service: string, config: OAuthConfiguration, options?: { loginStyle?: string }): 'popup' | 'redirect' | undefined {
		const loginStyle = options?.loginStyle || config.loginStyle || 'popup';

		if (loginStyle !== 'popup' && loginStyle !== 'redirect') {
			throw new Error(`Invalid login style: ${loginStyle}`);
		}

		if (loginStyle === 'redirect') {
			try {
				sessionStorage.setItem('Meteor.oauth.test', 'test');
				sessionStorage.removeItem('Meteor.oauth.test');
			} catch (e) {
				// If session storage isn't available (e.g. private mode in some browsers),
				// fall back to popup.
				return 'popup';
			}
		}

		return loginStyle;
	},

	_stateParam(loginStyle: 'popup' | 'redirect' | undefined, credentialToken: string, redirectUrl?: string) {
		const state: OAuthState = {
			loginStyle,
			credentialToken,
			isCordova: false,
		};

		// If the user manually provided a redirect URL, or if the settings say to use
		// a redirect URL even for the popup flow (to support some strict OAuth providers),
		// add it to the state.
		const setRedirectUrl = Meteor.settings?.public?.packages?.oauth?.setRedirectUrlWhenLoginStyleIsPopup;

		if (loginStyle === 'redirect' || (setRedirectUrl && loginStyle === 'popup')) {
			state.redirectUrl = redirectUrl || `${window.location}`;
		}

		return Base64.encode(JSON.stringify(state));
	},

	_redirectUri(serviceName: string, _config: any, params?: any, absoluteUrlOptions?: any) {
		// Strip off internal flags from params
		const safeParams = params ? { ...params } : undefined;
		if (safeParams) {
			delete safeParams.cordova;
			delete safeParams.android;
		}

		const queryParams = safeParams && Object.keys(safeParams).length > 0 ? safeParams : null;

		return _constructUrl(Meteor.absoluteUrl(`_oauth/${serviceName}`, absoluteUrlOptions), null, queryParams);
	},

	saveDataForRedirect(loginService: string, credentialToken: string) {
		Reload._onMigrate('oauth', () => [
			true,
			{
				loginService,
				credentialToken,
			},
		]);
		Reload._migrate(null, {
			immediateMigration: true,
		});
	},

	getDataAfterRedirect() {
		const migrationData = Reload._migrationData('oauth');

		if (!migrationData?.credentialToken) {
			return null;
		}

		const { credentialToken } = migrationData;
		const key = OAuth._storageTokenPrefix + credentialToken;
		let credentialSecret;

		try {
			credentialSecret = sessionStorage.getItem(key);
			sessionStorage.removeItem(key);
		} catch (e) {
			Meteor._debug('error retrieving credentialSecret', e);
		}

		return {
			loginService: migrationData.loginService,
			credentialToken,
			credentialSecret,
		};
	},

	launchLogin(options: OAuthLoginOptions) {
		if (!options.loginService) {
			throw new Error('loginService required');
		}

		if (options.loginStyle === 'popup') {
			OAuth.showPopup(
				options.loginUrl,
				() => {
					if (options.credentialRequestCompleteCallback) {
						options.credentialRequestCompleteCallback(options.credentialToken);
					}
				},
				options.popupOptions,
			);
		} else if (options.loginStyle === 'redirect') {
			OAuth.saveDataForRedirect(options.loginService, options.credentialToken);
			window.location.href = options.loginUrl;
		} else {
			throw new Error('invalid login style');
		}
	},

	_handleCredentialSecret(credentialToken: string, secret: string) {
		check(credentialToken, String);
		check(secret, String);

		if (!Object.prototype.hasOwnProperty.call(credentialSecrets, credentialToken)) {
			credentialSecrets[credentialToken] = secret;
		} else {
			throw new Error('Duplicate credential token from OAuth login');
		}
	},

	_retrieveCredentialSecret(credentialToken: string) {
		let secret: string | null = credentialSecrets[credentialToken] ?? null;

		if (!secret) {
			const localStorageKey = OAuth._storageTokenPrefix + credentialToken;
			secret = Meteor._localStorage.getItem(localStorageKey);
			Meteor._localStorage.removeItem(localStorageKey);
		} else {
			delete credentialSecrets[credentialToken];
		}

		return secret;
	},
};

// -----------------------------------------------------------------------------
// Legacy Registration
// -----------------------------------------------------------------------------

Package.oauth = { OAuth };
