import { Meteor } from 'meteor/meteor';

import { settings } from '../../app/settings/client';

const openCenteredPopup = (url: string, width: number, height: number) => {
	const screenX = window.screenX ?? window.screenLeft;
	const screenY = window.screenY ?? window.screenTop;
	const outerWidth = window.outerWidth ?? document.body.clientWidth;
	const outerHeight = window.outerHeight ?? document.body.clientHeight - 22;
	// XXX what is the 22? Probably the height of the title bar.
	// Use `outerWidth - width` and `outerHeight - height` for help in
	// positioning the popup centered relative to the current window
	const left = screenX + (outerWidth - width) / 2;
	const top = screenY + (outerHeight - height) / 2;
	const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`;

	const newwindow = window.open(url, 'Login', features);

	if (!newwindow) {
		throw new Error('Could not open popup');
	}

	newwindow.focus();

	return newwindow;
};

const getPopupUrl = (credentialToken: string): string => {
	const loginUrl = settings.get<string | undefined>('CAS_login_url');

	if (!loginUrl) {
		throw new Error('CAS_login_url not set');
	}

	const appUrl = Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	const serviceUrl = `${appUrl}/_cas/${credentialToken}`;
	const url = new URL(loginUrl);
	url.searchParams.set('service', serviceUrl);

	return url.href;
};

const waitForPopupClose = (popup: Window) => {
	return new Promise<void>((resolve) => {
		const checkPopupOpen = setInterval(() => {
			if (popup.closed || popup.closed === undefined) {
				clearInterval(checkPopupOpen);
				resolve();
			}
		}, 100);
	});
};

export const openCASLoginPopup = async (credentialToken: string) => {
	const popupWidth = settings.get<number>('CAS_popup_width') || 800;
	const popupHeight = settings.get<number>('CAS_popup_height') || 600;

	const popupUrl = getPopupUrl(credentialToken);
	const popup = openCenteredPopup(popupUrl, popupWidth, popupHeight);

	await waitForPopupClose(popup);
};
