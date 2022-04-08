import { Meteor } from 'meteor/meteor';

export const getConfig = (key: string): string | null => {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.get(key) || Meteor._localStorage.getItem(`rc-config-${key}`);
};
