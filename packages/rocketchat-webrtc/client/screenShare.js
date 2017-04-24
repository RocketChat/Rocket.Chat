/* globals ChromeScreenShare, fireGlobalEvent */
this.ChromeScreenShare = {
	screenCallback: undefined,
	getSourceId(navigator, callback) {
		if (callback == null) {
			throw '"callback" parameter is mandatory.';
		}
		ChromeScreenShare.screenCallback = callback;
		if (navigator === 'electron') {
			return fireGlobalEvent('get-sourceId', '*');
		} else {
			return window.postMessage('get-sourceId', '*');
		}
	}
};

window.addEventListener('message', function(e) {
	if (e.origin !== window.location.origin) {
		return;
	}
	if (e.data === 'PermissionDeniedError') {
		if (ChromeScreenShare.screenCallback != null) {
			return ChromeScreenShare.screenCallback('PermissionDeniedError');
		} else {
			throw new Error('PermissionDeniedError');
		}
	}
	if (e.data.sourceId != null) {
		return typeof ChromeScreenShare.screenCallback === 'function' && ChromeScreenShare.screenCallback(e.data.sourceId);
	}
});
