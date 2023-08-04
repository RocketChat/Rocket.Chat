import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/client';

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
	const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`;

	const newwindow = window.open(url, 'Login', features);
	newwindow?.focus();

	return newwindow;
};

(Meteor as any).loginWithCas = (_?: unknown, callback?: () => void) => {
	const credentialToken = Random.id();
	const loginUrl = settings.get('CAS_login_url');
	const popupWidth = settings.get('CAS_popup_width') || 800;
	const popupHeight = settings.get('CAS_popup_height') || 600;

	if (!loginUrl) {
		return;
	}

	const appUrl = Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	// check if the provided CAS URL already has some parameters
	const delim = loginUrl.split('?').length > 1 ? '&' : '?';
	const popupUrl = `${loginUrl}${delim}service=${appUrl}/_cas/${credentialToken}`;

	const popup = openCenteredPopup(popupUrl, popupWidth, popupHeight);

	const checkPopupOpen = setInterval(() => {
		let popupClosed;
		try {
			// Fix for #328 - added a second test criteria (popup.closed === undefined)
			// to humour this Android quirk:
			// http://code.google.com/p/android/issues/detail?id=21061
			popupClosed = popup?.closed || popup?.closed === undefined;
		} catch (e) {
			// For some unknown reason, IE9 (and others?) sometimes (when
			// the popup closes too quickly?) throws "SCRIPT16386: No such
			// interface supported" when trying to read 'popup.closed'. Try
			// again in 100ms.
			return;
		}

		if (popupClosed) {
			clearInterval(checkPopupOpen);

			// check auth on server.
			Accounts.callLoginMethod({
				methodArguments: [{ cas: { credentialToken } }],
				userCallback: callback,
			});
		}
	}, 100);
};
