import type { PopupDimensions } from './types';

// Centered popup, polled every 100ms — same shape as OAuth.showPopup in
// meteor/oauth (oauth_browser.js). Returns nothing; the callback fires once
// the popup is closed.
//
// Defaults (650x331) match Meteor's. Provider-specific overrides come through
// `popupOptions`, e.g. Google uses 600px height and meteor-developer 749px.
export const showPopup = (url: string, callback: () => void, dimensions?: PopupDimensions): void => {
	const popup = openCenteredPopup(url, dimensions?.width ?? 650, dimensions?.height ?? 331);

	const checkPopupOpen = setInterval(() => {
		let popupClosed: boolean;
		try {
			// `popup.closed === undefined` covers an Android quirk
			// (https://issuetracker.google.com/issues/36915974).
			popupClosed = popup.closed || popup.closed === undefined;
		} catch {
			// IE9 sometimes throws "SCRIPT16386: No such interface supported"
			// on `popup.closed` when the popup closes too quickly. Try again.
			return;
		}

		if (popupClosed) {
			clearInterval(checkPopupOpen);
			callback();
		}
	}, 100);
};

const openCenteredPopup = (url: string, width: number, height: number): Window => {
	const screenX = typeof window.screenX !== 'undefined' ? window.screenX : (window as any).screenLeft;
	const screenY = typeof window.screenY !== 'undefined' ? window.screenY : (window as any).screenTop;
	const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth;
	const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.body.clientHeight - 22;

	const left = screenX + (outerWidth - width) / 2;
	const top = screenY + (outerHeight - height) / 2;
	const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`;

	const newwindow = window.open(url, 'Login', features);

	if (!newwindow || newwindow.closed) {
		const err = new Error('The login popup was blocked by the browser') as Error & { attemptedUrl?: string };
		err.attemptedUrl = url;
		throw err;
	}

	if (newwindow.focus) {
		newwindow.focus();
	}

	return newwindow;
};
