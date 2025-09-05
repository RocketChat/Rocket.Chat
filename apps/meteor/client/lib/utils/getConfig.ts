import { userStorage } from '../user';

export const getConfig = <T>(key: string, defaultValue?: T): string | null | T => {
	const searchParams = new URLSearchParams(window.location.search);

	const storedItem = searchParams.get(key) || userStorage.getItem(`rc-config-${key}`);

	return storedItem ?? defaultValue ?? null;
};
