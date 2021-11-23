<<<<<<< HEAD
import { useContext } from 'react';
=======
import { useContext, useMemo } from 'react';

>>>>>>> feat/apps-category-filter
import { AppsContext } from '../AppsContext';
import { filterAppByCategories } from '../helpers/filterAppByCategories';
import { App } from '../types';
<<<<<<< HEAD
import { AsyncState, AsyncStatePhase } from '/client/lib/asyncState';
=======
>>>>>>> feat/apps-category-filter
// TODO: memoize app list if props don't change
export const useFilteredApps = ({
	filterFunction = () => true,
	text,
	sortDirection,
	current,
	categories = [],
	itemsPerPage,
}: {
	filterFunction: (app: App) => boolean;
	text: string;
	sortDirection: 'asc' | 'desc';
	current: number;
	itemsPerPage: number;
	categories?: string[];
<<<<<<< HEAD
}): AsyncState<{ items: App[]; total: number; count: number }> => {
=======
}): [App[], number] => {
>>>>>>> feat/apps-category-filter
	const { apps } = useContext(AppsContext);

	return useMemo(() => {
		if (!Array.isArray(apps) || apps.length === 0) {
<<<<<<< HEAD
			return { phase: AsyncStatePhase.LOADING, error: undefined };
		}

		const result = apps.filter(filterFunction);

		const filtered = result
			.filter((app) => filterAppByCategories(app, categories))
			.filter(({ name }) => name.toLowerCase().indexOf(text.toLowerCase()) > -1);

=======
			return [[], 0];
		}

		const filtered = apps
			.filter((app) => filterAppByCategories(app, categories))
			.filter(filterFunction(text));
>>>>>>> feat/apps-category-filter
		if (sortDirection === 'desc') {
			filtered.reverse();
		}

		const total = filtered.length;
		const start = current > total ? 0 : current;
		const end = current + itemsPerPage;
		const slice = filtered.slice(start, end);

<<<<<<< HEAD
		return {
			phase: AsyncStatePhase.RESOLVED,
			error: undefined,
			value: { items: slice, total: result.length, count: slice.length },
		};
=======
		return [slice, total];
>>>>>>> feat/apps-category-filter
	}, [apps, categories, current, filterFunction, itemsPerPage, sortDirection, text]);
};
