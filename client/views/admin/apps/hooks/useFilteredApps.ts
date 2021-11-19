import { useContext, useMemo } from 'react';

import { AppsContext } from '../AppsContext';
import { filterAppByCategories } from '../helpers/filterAppByCategories';
import { App } from '../types';
// TODO: memoize app list if props don't change
export const useFilteredApps = ({
	filterFunction = (text: string): ((app: App) => boolean) => {
		if (!text) {
			return (): boolean => true;
		}
		return (app: App): boolean => app.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
	},
	text,
	sortDirection,
	current,
	categories = [],
	itemsPerPage,
}: {
	filterFunction: (text: string) => (app: App) => boolean;
	text: string;
	sortDirection: 'asc' | 'desc';
	current: number;
	itemsPerPage: number;
	categories?: string[];
}): [App[], number] => {
	const { apps } = useContext(AppsContext);

	return useMemo(() => {
		if (!Array.isArray(apps) || apps.length === 0) {
			return [[], 0];
		}

		const filtered = apps
			.filter((app) => filterAppByCategories(app, categories))
			.filter(filterFunction(text));
		if (sortDirection === 'desc') {
			filtered.reverse();
		}

		const total = filtered.length;
		const start = current > total ? 0 : current;
		const end = current + itemsPerPage;
		const slice = filtered.slice(start, end);

		return [slice, total];
	}, [apps, categories, current, filterFunction, itemsPerPage, sortDirection, text]);
};
