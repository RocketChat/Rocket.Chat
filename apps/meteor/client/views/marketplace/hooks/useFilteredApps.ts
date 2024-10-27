import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { useMemo } from 'react';

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
import { useMarketplaceQuery } from './useMarketplaceQuery';

export type AppsContext = 'explore' | 'installed' | 'premium' | 'private' | 'requested';
export type PurchaseType = 'all' | 'free' | 'paid' | 'premium';
export type Status = 'all' | 'enabled' | 'disabled';
export type SortingMethod = 'az' | 'za' | 'mru' | 'lru' | 'urf' | 'url';

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
	context: AppsContext;
	text: string;
	purchaseType: PurchaseType;
	status: Status;
	sortingMethod: SortingMethod;
	current: number;
	itemsPerPage: number;
	categories: string[];
	isEnterpriseOnly?: boolean;
}): AsyncState<
	PaginatedResult<{
		items: App[];
		shouldShowSearchText: boolean;
		allApps: App[];
		totalAppsLength: number;
	}>
> => {
	const marketplaceQueryResult = useMarketplaceQuery();

	return useMemo(() => {
		if (marketplaceQueryResult.status === 'loading') {
			return {
				phase: AsyncStatePhase.LOADING,
				value: undefined,
				error: undefined,
			};
		}

		if (marketplaceQueryResult.status === 'error') {
			return {
				phase: AsyncStatePhase.REJECTED,
				value: undefined,
				error: marketplaceQueryResult.error as Error,
			};
		}

		let apps: App[];

		switch (context) {
			case 'premium':
			case 'explore':
			case 'requested':
				apps = marketplaceQueryResult.data.marketplace;
				break;
			case 'private':
				apps = marketplaceQueryResult.data.private;
				break;
			default:
				apps = marketplaceQueryResult.data.installed;
		}

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
			phase: AsyncStatePhase.RESOLVED,
			value: {
				items: slice,
				offset,
				total: filtered.length,
				totalAppsLength: apps.length,
				count: slice.length,
				shouldShowSearchText,
				allApps: filtered,
			},
		};
	}, [
		marketplaceQueryResult.status,
		marketplaceQueryResult.error,
		marketplaceQueryResult.data?.marketplace,
		marketplaceQueryResult.data?.private,
		marketplaceQueryResult.data?.installed,
		context,
		purchaseType,
		status,
		categories,
		text,
		sortingMethod,
		current,
		itemsPerPage,
	]);
};
