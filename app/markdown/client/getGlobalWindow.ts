export const getGlobalWindow = (): Omit<Window, 'self' | 'top' | 'window'> => window;
