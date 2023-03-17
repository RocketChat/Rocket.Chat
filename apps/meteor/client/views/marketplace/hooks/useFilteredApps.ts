import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ContextType } from 'react';
import { useMemo } from 'react';

import type { AsyncState } from '../../../lib/asyncState';
import { AsyncStatePhase } from '../../../lib/asyncState';
import type { AppsContext } from '../AppsContext';
import { filterAppsByCategories } from '../helpers/filterAppsByCategories';
import { filterAppsByDisabled } from '../helpers/filterAppsByDisabled';
import { filterAppsByEnabled } from '../helpers/filterAppsByEnabled';
import { filterAppsByEnterprise } from '../helpers/filterAppsByEnterprise';
import { filterAppsByFree } from '../helpers/filterAppsByFree';
import { filterAppsByPaid } from '../helpers/filterAppsByPaid';
import { filterAppsByText } from '../helpers/filterAppsByText';
import { sortAppsByAlphabeticalOrInverseOrder } from '../helpers/sortAppsByAlphabeticalOrInverseOrder';
import { sortAppsByClosestOrFarthestModificationDate } from '../helpers/sortAppsByClosestOrFarthestModificationDate';
import type { App } from '../types';

export type appsDataType = ContextType<typeof AppsContext>['installedApps'] | ContextType<typeof AppsContext>['marketplaceApps'];

export const useFilteredApps = ({
	appsData,
	text,
	current,
	itemsPerPage,
	categories = [],
	purchaseType,
	sortingMethod,
	status,
	context,
}: {
	appsData: appsDataType;
	text: string;
	current: number;
	itemsPerPage: number;
	categories?: string[];
	purchaseType?: string;
	isEnterpriseOnly?: boolean;
	sortingMethod?: string;
	status?: string;
	context?: string;
}): AsyncState<
	{ items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult & { allApps: App[] } & { totalAppsLength: number }
> => {
	const value = useMemo(() => {
		if (appsData.value === undefined) {
			return undefined;
		}

		const { apps } = appsData.value;

		let filtered: App[] = apps;
		let shouldShowSearchText = true;

		const sortingMethods: Record<string, () => App[]> = {
			urf: () =>
				filtered.sort(
					(firstApp, secondApp) => (secondApp?.appRequestStats?.totalUnseen || 0) - (firstApp?.appRequestStats?.totalUnseen || 0),
				),
			url: () =>
				filtered.sort(
					(firstApp, secondApp) => (firstApp?.appRequestStats?.totalUnseen || 0) - (secondApp?.appRequestStats?.totalUnseen || 0),
				),
			az: () => filtered.sort((firstApp, secondApp) => sortAppsByAlphabeticalOrInverseOrder(firstApp.name, secondApp.name)),
			za: () => filtered.sort((firstApp, secondApp) => sortAppsByAlphabeticalOrInverseOrder(secondApp.name, firstApp.name)),
			mru: () =>
				filtered.sort((firstApp, secondApp) => sortAppsByClosestOrFarthestModificationDate(firstApp.modifiedAt, secondApp.modifiedAt)),
			lru: () =>
				filtered.sort((firstApp, secondApp) => sortAppsByClosestOrFarthestModificationDate(secondApp.modifiedAt, firstApp.modifiedAt)),
		};

		if (context && context === 'enterprise') {
			filtered = apps.filter(({ categories }) => categories.includes('Enterprise'));
		}

		if (sortingMethod) {
			filtered = sortingMethods[sortingMethod]();
		}

		const filterByPurchaseType: Record<string, () => App[]> = {
			paid: () => filtered.filter(filterAppsByPaid),
			enterprise: () => filtered.filter(filterAppsByEnterprise),
			free: () => filtered.filter(filterAppsByFree),
		};

		if (purchaseType && purchaseType !== 'all') {
			filtered = filterByPurchaseType[purchaseType]();

			if (!filtered.length) shouldShowSearchText = false;
		}

		if (status && status !== 'all') {
			filtered = status === 'enabled' ? filtered.filter(filterAppsByEnabled) : filtered.filter(filterAppsByDisabled);

			if (!filtered.length) shouldShowSearchText = false;
		}

		if (Boolean(categories.length) && Boolean(text)) {
			filtered = filtered.filter((app) => filterAppsByCategories(app, categories)).filter(({ name }) => filterAppsByText(name, text));
			shouldShowSearchText = true;
		}

		if (Boolean(categories.length) && !text) {
			filtered = filtered.filter((app) => filterAppsByCategories(app, categories));
			shouldShowSearchText = false;
		}

		if (!categories.length && Boolean(text)) {
			filtered = filtered.filter(({ name }) => filterAppsByText(name, text));
			shouldShowSearchText = true;
		}

		if (context && context === 'requested') {
			filtered = apps.filter(({ appRequestStats, installed }) => Boolean(appRequestStats) && !installed);
		}

		const total = filtered.length;
		const offset = current > total ? 0 : current;
		const end = current + itemsPerPage;
		const slice = filtered.slice(offset, end);

		return {
			items: slice,
			offset,
			total: filtered.length,
			totalAppsLength: apps.length,
			count: slice.length,
			shouldShowSearchText,
			allApps: filtered,
		};
	}, [appsData.value, sortingMethod, purchaseType, status, categories, text, context, current, itemsPerPage]);

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
