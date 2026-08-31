const readLocalStorage = (key: string): string | null => {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
};

export const getConfig = <T>(key: string, defaultValue?: T): string | null | T => {
	const searchParams = new URLSearchParams(window.location.search);

	const storedItem = searchParams.get(key) || readLocalStorage(`rc-config-${key}`);

	return storedItem ?? defaultValue ?? null;
};

export const getNumericConfig = (key: string, defaultValue: number): number => {
	const parsed = Number(getConfig(key, defaultValue));

	return Number.isFinite(parsed) ? parsed : defaultValue;
};
