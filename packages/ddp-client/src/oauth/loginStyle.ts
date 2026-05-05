import type { LoginStyle, LoginStyleConfig, LoginStyleOptions } from './types';

// Mirrors `OAuth._loginStyle` from meteor/oauth.
// - Cordova always uses popup
// - Otherwise: explicit option > config default > 'popup'
// - Falls back to popup when sessionStorage isn't available (private mode)
export const resolveLoginStyle = (
	config: LoginStyleConfig,
	options?: LoginStyleOptions,
	context: { isCordova?: boolean } = {},
): LoginStyle => {
	if (context.isCordova) {
		return 'popup';
	}

	const requested = options?.loginStyle || config.loginStyle || 'popup';

	if (requested !== 'popup' && requested !== 'redirect') {
		throw new Error(`Invalid login style: ${requested}`);
	}

	let style: LoginStyle = requested;

	if (style === 'redirect') {
		try {
			sessionStorage.setItem('Meteor.oauth.test', 'test');
			sessionStorage.removeItem('Meteor.oauth.test');
		} catch {
			style = 'popup';
		}
	}

	return style;
};
