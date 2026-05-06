import { showPopup } from './showPopup';
import type { LaunchLoginOptions } from './types';

// Sessionstorage key under which we stash the in-flight redirect data so that
// after the round-trip back from the OAuth provider we can recover the
// credentialToken/loginService that started the flow. Meteor's oauth package
// uses `Reload._migrationData` for this; sessionStorage gives equivalent
// across-reload persistence without the Meteor-specific machinery.
const REDIRECT_DATA_KEY = 'Meteor.oauth.redirectData';

const saveDataForRedirect = (loginService: string, credentialToken: string): void => {
	try {
		sessionStorage.setItem(REDIRECT_DATA_KEY, JSON.stringify({ loginService, credentialToken }));
	} catch {
		// sessionStorage unavailable (Safari private mode etc.) — the redirect
		// flow won't work; the caller should have fallen back to popup style.
	}
};

export const getDataAfterRedirect = (): {
	loginService: string;
	credentialToken: string;
} | null => {
	try {
		const raw = sessionStorage.getItem(REDIRECT_DATA_KEY);
		if (!raw) return null;
		sessionStorage.removeItem(REDIRECT_DATA_KEY);
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || !parsed.credentialToken) {
			return null;
		}
		return { loginService: String(parsed.loginService), credentialToken: String(parsed.credentialToken) };
	} catch {
		return null;
	}
};

// Mirrors `OAuth.launchLogin` from meteor/oauth (oauth_client.js):
// - popup: open centered popup, fire the callback on close
// - redirect: save data, navigate to the login URL (the provider redirects
//   back to <root>/_oauth/<service> which is served by the Meteor server's
//   oauth package)
export const launchLogin = (options: LaunchLoginOptions): void => {
	if (!options.loginService) {
		throw new Error('loginService required');
	}

	if (options.loginStyle === 'popup') {
		showPopup(options.loginUrl, () => options.credentialRequestCompleteCallback?.(options.credentialToken), options.popupOptions);
		return;
	}

	if (options.loginStyle === 'redirect') {
		saveDataForRedirect(options.loginService, options.credentialToken);
		window.location.href = options.loginUrl;
		return;
	}

	throw new Error('invalid login style');
};
