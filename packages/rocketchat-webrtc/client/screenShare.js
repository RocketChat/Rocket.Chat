/* globals ChromeScreenShare, fireGlobalEvent */
this.ChromeScreenShare = {
	callbacks: {},
	installed: false,
	init() {
		this.callbacks['get-RocketChatScreenSharingExtensionVersion'] = version => {
			if (version) {
				this.installed = true;
			}
		};
		window.postMessage('get-RocketChatScreenSharingExtensionVersion', '*');
	},
	getSourceId(navigator, callback) {
		if (callback == null) {
			throw '"callback" parameter is mandatory.';
		}
		this.callbacks['getSourceId'] = callback;
		if (navigator === 'electron') {
			return fireGlobalEvent('get-sourceId', '*');
		}
		return window.postMessage('get-sourceId', '*');
	}
};

ChromeScreenShare.init();

window.addEventListener('message', function(e) {
	if (e.origin !== window.location.origin) {
		return;
	}
	if (e.data === 'PermissionDeniedError') {
		if (ChromeScreenShare.callbacks['getSourceId'] != null) {
			return ChromeScreenShare.callbacks['getSourceId']('PermissionDeniedError');
		}
		throw new Error('PermissionDeniedError');
	}
	if (e.data.version != null) {
		ChromeScreenShare.callbacks['get-RocketChatScreenSharingExtensionVersion'] && ChromeScreenShare.callbacks['get-RocketChatScreenSharingExtensionVersion'](e.data.version);
	} else if (e.data.sourceId != null) {
		return typeof ChromeScreenShare.callbacks['getSourceId'] === 'function' && ChromeScreenShare.callbacks['getSourceId'](e.data.sourceId);
	}
});
