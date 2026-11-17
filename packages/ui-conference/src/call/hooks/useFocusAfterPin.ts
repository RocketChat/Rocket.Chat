import { useEffect, useState } from 'react';

/**
 * Which pin control should take the focus on the next render, after a pin toggled from the keyboard moved what it
 * sits on. The request lasts one render, so a control drawn later never steals the focus.
 */
export const useFocusAfterPin = (): [focusPinOf: string | null, requestFocus: (id: string) => void] => {
	const [focusPinOf, setFocusPinOf] = useState<string | null>(null);

	useEffect(() => {
		if (focusPinOf !== null) {
			setFocusPinOf(null);
		}
	}, [focusPinOf]);

	return [focusPinOf, setFocusPinOf];
};
