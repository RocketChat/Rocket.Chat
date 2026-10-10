// Schemes that run code in the page instead of navigating; everything else (deep links included) stays allowed.
const blockedProtocols = ['javascript:', 'data:', 'vbscript:'];

// Resolves relative URLs the way an anchor would, so they are checked by the scheme they end up with.
const base = 'https://rocket.chat/';

/** Whether a URL sent by an app is safe to open from a button or menu option. */
export const isSafeUrl = (url: string): boolean => {
	try {
		return !blockedProtocols.includes(new URL(url, base).protocol);
	} catch {
		return false;
	}
};
