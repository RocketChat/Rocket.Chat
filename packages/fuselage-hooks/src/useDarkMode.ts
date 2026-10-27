import { usePrefersColorScheme } from './usePrefersColorScheme';

export const useDarkMode = (forced?: boolean): boolean => {
	const systemDarkMode = usePrefersColorScheme('dark');

	if (forced !== undefined) {
		return forced;
	}

	return systemDarkMode;
};
