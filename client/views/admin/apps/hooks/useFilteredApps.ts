import { useMemo } from 'react';

import { PaginatedResult } from '../../../../../definition/rest/helpers/PaginatedResult';
import { AsyncState, AsyncStatePhase } from '../../../../lib/asyncState';
import { useAppsResult } from '../AppsContext';
import { filterAppByCategories } from '../helpers/filterAppByCategories';
import { filterAppByText } from '../helpers/filterAppByText';
import { App } from '../types';

export const useFilteredApps = ({
	filterFunction = (): boolean => true,
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
}): AsyncState<{ items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult> => {
	const result = useAppsResult();

	const value = useMemo(() => {
		if (result.value === undefined) {
			return undefined;
		}

		const apps = result.value.apps.filter(filterFunction);

		let filtered: App[] = apps;
		let shouldShowSearchText = true;

		if (Boolean(categories.length) && Boolean(text)) {
			filtered = apps.filter((app) => filterAppByCategories(app, categories)).filter(({ name }) => filterAppByText(name, text));
			shouldShowSearchText = true;
		}

		if (Boolean(categories.length) && !text) {
			filtered = apps.filter((app) => filterAppByCategories(app, categories));
			shouldShowSearchText = false;
		}

		if (!categories.length && Boolean(text)) {
			filtered = apps.filter(({ name }) => filterAppByText(name, text));
			shouldShowSearchText = true;
		}

		if (sortDirection === 'desc') {
			filtered.reverse();
		}

		const total = filtered.length;
		const offset = current > total ? 0 : current;
		const end = current + itemsPerPage;
		const slice = filtered.slice(offset, end);

		return { items: slice, offset, total: apps.length, count: slice.length, shouldShowSearchText };
	}, [categories, current, filterFunction, itemsPerPage, result.value, sortDirection, text]);

	if (result.phase === AsyncStatePhase.RESOLVED) {
		if (!value) {
			throw new Error('useFilteredApps - Unexpected state');
		}
		return {
			...result,
			value,
		};
	}

	if (result.phase === AsyncStatePhase.UPDATING) {
		throw new Error('useFilteredApps - Unexpected state');
	}

	return {
		...result,
		value: undefined,
	};
};
