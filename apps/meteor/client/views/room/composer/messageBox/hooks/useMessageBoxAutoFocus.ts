import type { Ref } from 'react';
import { useEffect, useRef } from 'react';

/**
 * if the user is types outside the message box and its not actually typing in any input field
 * then the message box should be focused
 * @returns callbackRef to bind the logic to the message box
 */
export const useMessageBoxAutoFocus = (): Ref<HTMLElement> => {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const { current: node } = ref;
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

			node?.focus();
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	return ref;
};
