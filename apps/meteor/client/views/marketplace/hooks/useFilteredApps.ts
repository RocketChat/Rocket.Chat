import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ContextType } from 'react';
import { useMemo } from 'react';

import type { AppsContext } from '../../../contexts/AppsContext';
import type { AsyncState } from '../../../lib/asyncState';
import { AsyncStatePhase } from '../../../lib/asyncState';
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
	categories: string[];
	purchaseType: string;
	isEnterpriseOnly?: boolean;
	sortingMethod: string;
	status: string;
	context?: string;
}): AsyncState<
	{ items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult & { allApps: App[] } & { totalAppsLength: number }
> => {
	const value = useMemo(() => {
		if (appsData.value === undefined) {
			return undefined;
		}

		const { apps } = appsData.value;
		const fallback = (apps: App[]) => apps;

		const sortingMethods: Record<string, (apps: App[]) => App[]> = {
			urf: (apps: App[]) =>
				apps.sort((firstApp, secondApp) => (secondApp?.appRequestStats?.totalUnseen || 0) - (firstApp?.appRequestStats?.totalUnseen || 0)),
			url: (apps: App[]) =>
				apps.sort((firstApp, secondApp) => (firstApp?.appRequestStats?.totalUnseen || 0) - (secondApp?.appRequestStats?.totalUnseen || 0)),
			az: (apps: App[]) => apps.sort((firstApp, secondApp) => sortAppsByAlphabeticalOrInverseOrder(firstApp.name, secondApp.name)),
			za: (apps: App[]) => apps.sort((firstApp, secondApp) => sortAppsByAlphabeticalOrInverseOrder(secondApp.name, firstApp.name)),
			mru: (apps: App[]) =>
				apps.sort((firstApp, secondApp) => sortAppsByClosestOrFarthestModificationDate(firstApp.modifiedAt, secondApp.modifiedAt)),
			lru: (apps: App[]) =>
				apps.sort((firstApp, secondApp) => sortAppsByClosestOrFarthestModificationDate(secondApp.modifiedAt, firstApp.modifiedAt)),
		};

		const filterByPurchaseType: Record<string, (apps: App[]) => App[]> = {
			all: fallback,
			paid: (apps: App[]) => apps.filter(filterAppsByPaid),
			enterprise: (apps: App[]) => apps.filter(filterAppsByEnterprise),
			free: (apps: App[]) => apps.filter(filterAppsByFree),
		};

		const filterByStatus: Record<string, (apps: App[]) => App[]> = {
			all: fallback,
			enabled: (apps: App[]) => apps.filter(filterAppsByEnabled),
			disabled: (apps: App[]) => apps.filter(filterAppsByDisabled),
		};

		const filterByContext: Record<string, (apps: App[]) => App[]> = {
			explore: fallback,
			installed: fallback,
			private: fallback,
			enterprise: (apps: App[]) => apps.filter(({ categories }) => categories.includes('Enterprise')),
			requested: (apps: App[]) => apps.filter(({ appRequestStats, installed }) => Boolean(appRequestStats) && !installed),
		};

		type appsFilterFunction = (apps: App[]) => App[];
		const pipeAppsFilter =
			(...functions: appsFilterFunction[]) =>
			(initialValue: App[]) =>
				functions.reduce((currentAppsList, currentFilterFunction) => currentFilterFunction(currentAppsList), initialValue);

		const filtered = pipeAppsFilter(
			context ? filterByContext[context] : fallback,
			filterByPurchaseType[purchaseType],
			filterByStatus[status],
			categories.length ? (apps: App[]) => apps.filter((app) => filterAppsByCategories(app, categories)) : fallback,
			text ? (apps: App[]) => apps.filter(({ name }) => filterAppsByText(name, text)) : fallback,
			sortingMethods[sortingMethod],
		)(apps);

		const shouldShowSearchText = !!text;
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
