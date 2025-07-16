import { fireGlobalEvent } from '../../../client/lib/utils/fireGlobalEvent';

export const ChromeScreenShare = {
	callbacks: {
		'get-RocketChatScreenSharingExtensionVersion': (version: unknown) => {
			if (version) {
				ChromeScreenShare.installed = true;
			}
		},
		'getSourceId': (_sourceId: string): void => undefined,
	},
	installed: false,
	init() {
		window.postMessage('get-RocketChatScreenSharingExtensionVersion', '*');
	},
	getSourceId(navigator: string, callback: (sourceId: string) => void) {
		if (!callback) {
			throw new Error('"callback" parameter is mandatory.');
		}
		this.callbacks.getSourceId = callback;
		if (navigator === 'electron') {
			return fireGlobalEvent('get-sourceId', '*');
		}
		return window.postMessage('get-sourceId', '*');
	},
};

ChromeScreenShare.init();

window.addEventListener('message', (e) => {
	if (e.origin !== window.location.origin) {
		return;
	}
	if (e.data === 'PermissionDeniedError') {
		if (ChromeScreenShare.callbacks.getSourceId != null) {
			return ChromeScreenShare.callbacks.getSourceId('PermissionDeniedError');
		}
		throw new Error('PermissionDeniedError');
	}
	if (e.data.version != null) {
		ChromeScreenShare.callbacks['get-RocketChatScreenSharingExtensionVersion']?.(e.data.version);
	} else if (e.data.sourceId != null) {
		return typeof ChromeScreenShare.callbacks.getSourceId === 'function' && ChromeScreenShare.callbacks.getSourceId(e.data.sourceId);
	}
});
