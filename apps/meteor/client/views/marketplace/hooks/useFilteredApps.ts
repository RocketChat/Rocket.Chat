import type { PaginatedResult } from '@rocket.chat/rest-typings';

import { useApps } from './useApps';
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

export const useFilteredApps = ({
	text,
	current,
	itemsPerPage,
	categories = [],
	purchaseType,
	sortingMethod,
	status,
	context,
}: {
	text: string;
	current: number;
	itemsPerPage: number;
	categories: string[];
	purchaseType: string;
	isEnterpriseOnly?: boolean;
	sortingMethod: string;
	status: string;
	context?: string;
}) =>
	useApps({
		select: ({
			marketplaceApps,
			installedApps,
			privateApps,
		}): PaginatedResult<{
			items: App[];
			shouldShowSearchText: boolean;
			allApps: App[];
			totalAppsLength: number;
		}> => {
			const apps = (() => {
				switch (context) {
					case 'premium':
					case 'explore':
					case 'requested':
						return marketplaceApps;
					case 'private':
						return privateApps;
					default:
						return installedApps;
				}
			})();

			const fallback = (apps: App[]) => apps;

			const sortingMethods: Record<string, (apps: App[]) => App[]> = {
				urf: (apps: App[]) =>
					apps.toSorted(
						(firstApp, secondApp) => (secondApp?.appRequestStats?.totalUnseen || 0) - (firstApp?.appRequestStats?.totalUnseen || 0),
					),
				url: (apps: App[]) =>
					apps.toSorted(
						(firstApp, secondApp) => (firstApp?.appRequestStats?.totalUnseen || 0) - (secondApp?.appRequestStats?.totalUnseen || 0),
					),
				az: (apps: App[]) => apps.toSorted((firstApp, secondApp) => sortAppsByAlphabeticalOrInverseOrder(firstApp.name, secondApp.name)),
				za: (apps: App[]) => apps.toSorted((firstApp, secondApp) => sortAppsByAlphabeticalOrInverseOrder(secondApp.name, firstApp.name)),
				mru: (apps: App[]) =>
					apps.toSorted((firstApp, secondApp) => sortAppsByClosestOrFarthestModificationDate(firstApp.modifiedAt, secondApp.modifiedAt)),
				lru: (apps: App[]) =>
					apps.toSorted((firstApp, secondApp) => sortAppsByClosestOrFarthestModificationDate(secondApp.modifiedAt, firstApp.modifiedAt)),
			};

			const filterByPurchaseType: Record<string, (apps: App[]) => App[]> = {
				all: fallback,
				paid: (apps: App[]) => apps.filter(filterAppsByPaid),
				premium: (apps: App[]) => apps.filter(filterAppsByEnterprise),
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
				premium: (apps: App[]) => apps.filter(({ categories }) => categories.includes('Premium')),
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
		},
	});
