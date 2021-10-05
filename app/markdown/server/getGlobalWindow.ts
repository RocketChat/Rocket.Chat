import { JSDOM } from 'jsdom';

export const getGlobalWindow = (): Omit<Window, 'self' | 'top' | 'window'> => {
	const { window } = new JSDOM('');
	return window;
};
