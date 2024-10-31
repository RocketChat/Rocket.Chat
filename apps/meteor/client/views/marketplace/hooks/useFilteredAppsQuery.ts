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
import type { MarketplaceContext } from './useMarketplaceContext';
import { useMarketplaceContext } from './useMarketplaceContext';
import { useMarketplaceQuery } from './useMarketplaceQuery';

export type PurchaseType = 'all' | 'free' | 'paid' | 'premium';
export type Status = 'all' | 'enabled' | 'disabled';
export type SortingMethod = 'az' | 'za' | 'mru' | 'lru' | 'urf' | 'url';

const fallback = (apps: App[]) => apps;

const filterByPurchaseType: Record<PurchaseType, (apps: App[]) => App[]> = {
	all: fallback,
	paid: (apps: App[]) => apps.filter(filterAppsByPaid),
	premium: (apps: App[]) => apps.filter(filterAppsByEnterprise),
	free: (apps: App[]) => apps.filter(filterAppsByFree),
};

const filterByStatus: Record<Status, (apps: App[]) => App[]> = {
	all: fallback,
	enabled: (apps: App[]) => apps.filter(filterAppsByEnabled),
	disabled: (apps: App[]) => apps.filter(filterAppsByDisabled),
};

const filterByContext: Record<MarketplaceContext, (apps: App[]) => App[]> = {
	explore: fallback,
	installed: fallback,
	private: fallback,
	premium: (apps: App[]) => apps.filter(({ categories }) => categories?.includes('Premium') ?? false),
	requested: (apps: App[]) => apps.filter(({ appRequestStats, installed }) => Boolean(appRequestStats) && !installed),
};

const comparatorBySortingMethod: Record<SortingMethod, (apps: App[]) => App[]> = {
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

type UseFilteredAppsQueryOptions = {
	text: string;
	purchaseType: PurchaseType;
	status: Status;
	categories: string[];
	sortingMethod: SortingMethod;
	offset: number;
	count: number;
};

export const useFilteredAppsQuery = ({
	text,
	purchaseType,
	status,
	categories,
	sortingMethod,
	offset,
	count,
}: UseFilteredAppsQueryOptions) => {
	const context = useMarketplaceContext();

	return useMarketplaceQuery({
		select: (data) => {
			let unfiltered: App[];

			switch (context) {
				case 'premium':
				case 'explore':
				case 'requested':
					unfiltered = data.marketplace;
					break;

				case 'private':
					unfiltered = data.private;
					break;

				case 'installed':
					unfiltered = data.installed;
					break;
			}

			// TODO: iterate over the apps instead of over the transforms
			const filtered = [
				filterByContext[context],
				filterByPurchaseType[purchaseType],
				filterByStatus[status],
				categories.length ? (apps: App[]) => apps.filter((app) => filterAppsByCategories(app, categories)) : fallback,
				text ? (apps: App[]) => apps.filter(({ name }) => filterAppsByText(name, text)) : fallback,
				comparatorBySortingMethod[sortingMethod],
			].reduce((currentAppsList, currentFilterFunction) => currentFilterFunction(currentAppsList), unfiltered);

			const items = filtered.slice(offset, offset + count);

			return {
				items,
				unfilteredCount: unfiltered.length,
				offset,
				count: items.length,
				total: filtered.length,
			};
		},
	});
};
