import { useContext, useMemo } from 'react';

import { AsyncState, AsyncStatePhase } from '../../../../lib/asyncState';
import { AppsContext } from '../AppsContext';
import { filterAppByCategories } from '../helpers/filterAppByCategories';
import { App } from '../types';
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
}): AsyncState<{ items: App[]; total: number; count: number }> => {
	const { apps } = useContext(AppsContext);

	return useMemo(() => {
		if (!Array.isArray(apps) || apps.length === 0) {
			return { phase: AsyncStatePhase.LOADING, error: undefined };
		}

		const result = apps.filter(filterFunction);

		const filtered = result
			.filter((app) => filterAppByCategories(app, categories))
			.filter(({ name }) => name.toLowerCase().indexOf(text.toLowerCase()) > -1);

		if (sortDirection === 'desc') {
			filtered.reverse();
		}

		const total = filtered.length;
		const start = current > total ? 0 : current;
		const end = current + itemsPerPage;
		const slice = filtered.slice(start, end);

		return {
			phase: AsyncStatePhase.RESOLVED,
			error: undefined,
			value: { items: slice, total: result.length, count: slice.length },
		};
	}, [apps, categories, current, filterFunction, itemsPerPage, sortDirection, text]);
};
