export const getGlobalWindow = (): Omit<Window, 'self' | 'top' | 'window'> => {
	const { JSDOM } = Promise.await(import('jsdom'));
	const { window } = new JSDOM('');
	return window;
};
