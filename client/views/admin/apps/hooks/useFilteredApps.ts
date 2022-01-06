import { useMemo, ContextType } from 'react';

import { PaginatedResult } from '../../../../../definition/rest/helpers/PaginatedResult';
import { AsyncState, AsyncStatePhase } from '../../../../lib/asyncState';
import type { AppsContext } from '../AppsContext';
import { filterAppByCategories } from '../helpers/filterAppByCategories';
import { filterAppByText } from '../helpers/filterAppByText';
import { App } from '../types';

type appsDataType = ContextType<typeof AppsContext>['installedApps'] | ContextType<typeof AppsContext>['marketplaceApps'];

export const useFilteredApps = ({
	appsData,
	text,
	sortDirection,
	current,
	categories = [],
	itemsPerPage,
}: {
	appsData: appsDataType;
	text: string;
	sortDirection: 'asc' | 'desc';
	current: number;
	itemsPerPage: number;
	categories?: string[];
}): AsyncState<{ items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult> => {
	const value = useMemo(() => {
		if (appsData.value === undefined) {
			return undefined;
		}

		const { apps } = appsData.value;

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
	}, [categories, current, appsData, itemsPerPage, sortDirection, text]);

	if (appsData.phase === AsyncStatePhase.RESOLVED) {
		if (!value) {
			throw new Error('useFilteredApps - Unexpected state');
		}
		return {
			...appsData,
			value,
		};
	}

	if (appsData.phase === AsyncStatePhase.UPDATING) {
		throw new Error('useFilteredApps - Unexpected state');
	}

	return {
		...appsData,
		value: undefined,
	};
};
