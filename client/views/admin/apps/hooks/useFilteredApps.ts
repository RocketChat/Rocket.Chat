import { useMemo, ContextType } from 'react';

import { PaginatedResult } from '../../../../../definition/rest/helpers/PaginatedResult';
import { AsyncState, AsyncStatePhase } from '../../../../lib/asyncState';
import type { AppsContext } from '../AppsContext';
import { filterAppByCategories } from '../helpers/filterAppByCategories';
import { filterAppByPurchaseType } from '../helpers/filterAppByPurchaseType';
import { filterAppByText } from '../helpers/filterAppByText';
import { filterAppsByClosestDate } from '../helpers/filterAppsByCloseDate';
import { filterAppsByFarthestDate } from '../helpers/filterAppsByFarthestDate';
import { App } from '../types';

type appsDataType = ContextType<typeof AppsContext>['installedApps'] | ContextType<typeof AppsContext>['marketplaceApps'];

export const useFilteredApps = ({
	appsData,
	text,
	current,
	itemsPerPage,
	categories = [],
	purchaseType,
	sorting,
}: {
	appsData: appsDataType;
	text: string;
	current: number;
	itemsPerPage: number;
	categories?: string[];
	purchaseType?: string;
	sorting?: string;
}): AsyncState<{ items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult> => {
	const value = useMemo(() => {
		if (appsData.value === undefined) {
			return undefined;
		}

		const { apps } = appsData.value;

		let filtered: App[] = apps;
		let shouldShowSearchText = true;

		const sortingMethods: Record<string, () => App[]> = {
			za: () => filtered.reverse(),
			mru: () => filtered.sort((firstApp, secondApp) => filterAppsByClosestDate(firstApp.modifiedDate, secondApp.modifiedDate)),
			lru: () => filtered.sort((firstApp, secondApp) => filterAppsByFarthestDate(firstApp.modifiedDate, secondApp.modifiedDate)),
		};

		if (!!sorting && sorting !== 'az') {
			console.log(filtered.map((app) => app.id));
			filtered = sortingMethods[sorting]();
			console.log(filtered.map((app) => app.id));
		}

		if (purchaseType && purchaseType !== 'all') {
			filtered = filterAppByPurchaseType(filtered, purchaseType);

			if (!filtered.length) {
				shouldShowSearchText = false;
			}
		}

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

		const total = filtered.length;
		const offset = current > total ? 0 : current;
		const end = current + itemsPerPage;
		const slice = filtered.slice(offset, end);

		return { items: slice, offset, total: apps.length, count: slice.length, shouldShowSearchText };
	}, [appsData.value, purchaseType, categories, text, current, itemsPerPage]);

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
