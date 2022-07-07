const getFocusableElements = (element) => element.querySelectorAll(
	'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, div[contenteditable="true"]',
);

export const handleTabKey = (event, element) => {
	const focusableElements = getFocusableElements(element);

	if (focusableElements.length > 0) {
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (focusableElements.length === 1) {
			firstElement.focus();
			return event.preventDefault();
		}

		if (!event.shiftKey && document.activeElement === lastElement) {
			firstElement.focus();
			return event.preventDefault();
		}

		if (event.shiftKey && document.activeElement === firstElement) {
			lastElement.focus();
			return event.preventDefault();
		}
	}
};

export const addFocusFirstElement = (element) => {
	const focusableElements = getFocusableElements(element);
	if (focusableElements.length > 0) {
		// Wait for the next "tick"
		setTimeout(() => focusableElements[0].focus(), 0);
	}
};

export const addFocusMessageField = (element) => {
	const messageField = element.querySelector('footer div[contenteditable="true"]');
	if (messageField) {
		// Wait for the next "tick"
		setTimeout(() => messageField.focus(), 0);
		return true;
	}
	return false;
}
