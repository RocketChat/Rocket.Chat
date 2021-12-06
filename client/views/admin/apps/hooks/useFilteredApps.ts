import { useContext, useMemo } from 'react';

import { PaginatedResult } from '../../../../../definition/rest/helpers/PaginatedResult';
import { AsyncState, AsyncStatePhase } from '../../../../lib/asyncState';
import { AppsContext } from '../AppsContext';
import { filterAppByCategories } from '../helpers/filterAppByCategories';
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
}): AsyncState<{ items: App[] } & PaginatedResult> => {
	const result = useContext(AppsContext);

	const value = useMemo(() => {
		if (result.value === undefined) {
			return undefined;
		}
		const apps = result.value.apps.filter(filterFunction);

		const filtered = apps
			.filter((app) => filterAppByCategories(app, categories))
			.filter(({ name }) => name.toLowerCase().indexOf(text.toLowerCase()) > -1);

		if (sortDirection === 'desc') {
			filtered.reverse();
		}

		const total = filtered.length;
		const offset = current > total ? 0 : current;
		const end = current + itemsPerPage;
		const slice = filtered.slice(offset, end);

		return { items: slice, offset, total: apps.length, count: slice.length };
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
