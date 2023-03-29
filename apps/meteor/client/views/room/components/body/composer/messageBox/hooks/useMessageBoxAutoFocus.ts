import { useCallback } from 'react';

/**
 * if the user is types outside the message box and its not actually typing in any input field
 * then the message box should be focused
 * @returns callbackRef to bind the logic to the message box
 */
export const useMessageBoxAutoFocus = () => {
	return useCallback((node: HTMLTextAreaElement) => {
		document.addEventListener('keydown', (e) => {
			const { target } = e;

			if (!target) {
				return;
			}

			if (target === node) {
				return;
			}
			if (!((e.keyCode > 45 && e.keyCode < 91) || e.keyCode === 8)) {
				return;
			}

			if (/input|textarea|select/i.test((target as HTMLElement).tagName)) {
				return;
			}

			if (e.ctrlKey === true || e.metaKey === true) {
				return;
			}

			node.focus();
		});
	}, []);
};
