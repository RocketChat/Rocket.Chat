let globalWindow: Omit<Window, 'self' | 'top' | 'window'> | undefined = global.window;

export const getGlobalWindow = () => globalWindow;

export const setGlobalWindow = (window: Omit<Window, 'self' | 'top' | 'window'>) => {
	globalWindow = window;
};
