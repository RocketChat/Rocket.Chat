import { addons, useState, useEffect } from 'storybook/preview-api';

import { store } from './Tool.js';
import { DARK_MODE_EVENT_NAME } from './constants.js';

/**
 * Returns the current state of storybook's dark-mode
 */
export function useDarkMode(): boolean {
	const [isDark, setIsDark] = useState(store().current === 'dark');

	useEffect(() => {
		const chan = addons.getChannel();
		chan.on(DARK_MODE_EVENT_NAME, setIsDark);
		return () => chan.off(DARK_MODE_EVENT_NAME, setIsDark);
	}, []);

	return isDark;
}

export * from './constants.js';
