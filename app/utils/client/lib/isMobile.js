export const isMobile = () => {
	if (/Mobi/.test(navigator.userAgent)) {
		return true;
	}
	return false;
};
