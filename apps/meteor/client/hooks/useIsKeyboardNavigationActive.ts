export const useIsKeyboardNavigationActive = () => {
	const { activeElement } = document;

	if (!activeElement) {
		return false;
	}

	return activeElement.classList.contains('focus-visible');
};
