export const isIE = function isIE() {
	const { userAgent } = window.navigator;
	const Idx = userAgent.indexOf('MSIE');

	// If IE, return version number.
	if (Idx > 0) {
		return parseInt(userAgent.substring(Idx + 5, userAgent.indexOf('.', Idx)));
	}
	// If IE 11 then look for Updated user agent string.
	if (navigator.userAgent.match(/Trident\/7\./)) {
		return 11;
	}
	return 0;
};
