export const isMobile = () => {
	if (window.matchMedia('(max-width: 500px)').matches) {
		return true;
	}
	return false;
};
