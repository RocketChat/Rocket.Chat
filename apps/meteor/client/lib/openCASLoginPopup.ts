import { Meteor } from 'meteor/meteor';

import { settings } from './settings';

const CAS_LOGIN_POPUP_TIMEOUT_MS = 120_000;
const CAS_LOGIN_POPUP_POLL_INTERVAL_MS = 100;
const CAS_LOGIN_POPUP_MESSAGE = 'cas-login-complete';

type CASPopupMessage = {
	type: typeof CAS_LOGIN_POPUP_MESSAGE;
	credentialToken: string;
};

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
	const loginUrl = settings.peek<string | undefined>('CAS_login_url');

	if (!loginUrl) {
		throw new Error('CAS_login_url not set');
	}

	const appUrl = Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	const serviceUrl = `${appUrl}/_cas/${credentialToken}`;
	const url = new URL(loginUrl);
	url.searchParams.set('service', serviceUrl);

	return url.href;
};

const closePopup = (popup: Window): void => {
	if (!popup.closed) {
		popup.close();
	}
};

const isCASPopupMessage = (message: unknown, credentialToken: string): message is CASPopupMessage => {
	if (!message || typeof message !== 'object') {
		return false;
	}

	return (
		'type' in message &&
		'credentialToken' in message &&
		message.type === CAS_LOGIN_POPUP_MESSAGE &&
		message.credentialToken === credentialToken
	);
};

const waitForPopupClose = (popup: Window, credentialToken: string) => {
	const appOrigin = window.location.origin;

	return new Promise<void>((resolve, reject) => {
		let settled = false;

		const cleanup = () => {
			clearInterval(checkPopupOpen);
			clearTimeout(timeoutId);
			window.removeEventListener('message', handleMessage);
		};

		const resolveLogin = () => {
			if (settled) {
				return;
			}

			settled = true;
			cleanup();
			if (!popup.closed && popup.closed !== undefined) {
				closePopup(popup);
			}
			resolve();
		};

		const rejectLogin = () => {
			if (settled) {
				return;
			}

			settled = true;
			cleanup();
			closePopup(popup);
			reject(new Error('CAS login popup timed out before completing authentication'));
		};

		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== appOrigin || !isCASPopupMessage(event.data, credentialToken)) {
				return;
			}

			resolveLogin();
		};

		const checkPopupOpen = setInterval(() => {
			if (popup.closed || popup.closed === undefined) {
				resolveLogin();
			}
		}, CAS_LOGIN_POPUP_POLL_INTERVAL_MS);

		const timeoutId = setTimeout(rejectLogin, CAS_LOGIN_POPUP_TIMEOUT_MS);

		window.addEventListener('message', handleMessage);
	});
};

export const openCASLoginPopup = async (credentialToken: string) => {
	const popupWidth = settings.peek<number>('CAS_popup_width') || 800;
	const popupHeight = settings.peek<number>('CAS_popup_height') || 600;

	const popupUrl = getPopupUrl(credentialToken);
	const popup = openCenteredPopup(popupUrl, popupWidth, popupHeight);

	await waitForPopupClose(popup, credentialToken);
};
