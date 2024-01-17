export const isIE11: boolean = ((): boolean => {
	const { userAgent } = window.navigator;
	const msieIdx = userAgent.indexOf('MSIE');

	if (msieIdx > 0) {
		return parseInt(userAgent.substring(msieIdx + 5, userAgent.indexOf('.', msieIdx))) === 11;
	}

	// If MSIE detection fails, check the Trident engine version
	if (navigator.userAgent.match(/Trident\/7\./)) {
		return true;
	}

	return false;
})();
