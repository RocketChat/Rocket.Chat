import type { LoginStyle, StateParamOptions } from './types';

// Mirrors `OAuth._stateParam` from meteor/oauth (oauth_client.js): builds the
// base64-encoded state JSON the OAuth provider echoes back so the popup/redirect
// callback can match the credential to the original attempt.
//
// `redirectUrl` is included for the `redirect` flow, and optionally for the
// `popup` flow when the server enables `oauth.setRedirectUrlWhenLoginStyleIsPopup`
// — same gating Meteor applies via `Meteor.settings.public.packages.oauth`.
export const stateParam = (
	loginStyle: LoginStyle,
	credentialToken: string,
	redirectUrl?: string,
	options: StateParamOptions = {},
): string => {
	const state: Record<string, unknown> = {
		loginStyle,
		credentialToken,
		isCordova: !!options.isCordova,
	};

	if (
		loginStyle === 'redirect' ||
		(options.setRedirectUrlWhenLoginStyleIsPopup && loginStyle === 'popup')
	) {
		state.redirectUrl = redirectUrl || (typeof window !== 'undefined' ? `${window.location}` : '');
	}

	// Encode base64 — not all login services URI-encode the state parameter on
	// the round trip back to us.
	if (typeof btoa === 'function') {
		return btoa(JSON.stringify(state));
	}
	return Buffer.from(JSON.stringify(state)).toString('base64');
};
