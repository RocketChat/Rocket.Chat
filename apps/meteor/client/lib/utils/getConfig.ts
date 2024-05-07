import { Meteor } from 'meteor/meteor';

export const getConfig = <T>(key: string, defaultValue?: T): string | null | T => {
	const searchParams = new URLSearchParams(window.location.search);

	const storedItem = searchParams.get(key) || Meteor._localStorage.getItem(`rc-config-${key}`);

	return storedItem ?? defaultValue ?? null;
};
