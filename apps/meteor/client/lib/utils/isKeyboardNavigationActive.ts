export const isKeyboardNavigationActive = () => {
	const { activeElement } = document;

	if (!activeElement || !(activeElement instanceof HTMLElement)) {
		return false;
	}

	return activeElement.classList.contains('focus-visible');
};
