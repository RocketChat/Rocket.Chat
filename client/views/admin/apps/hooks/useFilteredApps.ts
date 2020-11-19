import { useContext } from 'react';

import { AppsContext } from '../AppsContext';
import { App } from '../types';

export const useFilteredApps = ({
	filterFunction = (text: string): ((app: App) => boolean) => {
		if (!text) { return (): boolean => true; }
		return (app: App): boolean => app.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
	},
	text,
	sort: [, sortDirection],
	current,
	itemsPerPage,
}: {
	filterFunction: (text: string) => (app: App) => boolean;
	text: string;
	sort: [string, 'asc' | 'desc'];
	current: number;
	itemsPerPage: number;
	apps: App[];
}): [App[] | null, number] => {
	const { apps } = useContext(AppsContext);

	if (!Array.isArray(apps) || apps.length === 0) {
		return [null, 0];
	}

	const filtered = apps.filter(filterFunction(text));
	if (sortDirection === 'desc') {
		filtered.reverse();
	}

	const total = filtered.length;
	const start = current > total ? 0 : current;
	const end = current + itemsPerPage;
	const slice = filtered.slice(start, end);

	return [slice, total];
};
