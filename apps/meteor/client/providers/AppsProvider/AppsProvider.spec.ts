import type { App } from '@rocket.chat/core-typings';
import type { UseQueryResult } from '@tanstack/react-query';

import { createFakeApp } from '../../../tests/mocks/data';
import { createFakeAppInstalledMarketplace, createFakeAppPrivate } from '../../../tests/mocks/data/marketplace';
import { storeQueryFunction } from './storeQueryFunction';

describe(`when an app installed from the Marketplace, but has since been unpublished`, () => {
	it(`should still be present in the installed app data provided`, () => {
		const marketplaceMockQuery = {
			data: [createFakeApp({ id: 'marketplace-1' }), createFakeAppInstalledMarketplace({ id: 'marketplace-2' })],
			isFetched: true,
		} as unknown as UseQueryResult<App[], unknown>;

		const instanceMockQuery = {
			data: [
				marketplaceMockQuery.data?.[1],
				createFakeAppInstalledMarketplace({ id: 'marketplace-3' }), // This app has been installed via Marketplace but has been unpublished since
				createFakeAppPrivate({ id: 'private-1' }),
			],
			isFetched: true,
		} as unknown as UseQueryResult<App[], unknown>;

		const [marketplaceList, installedList, privateList] = storeQueryFunction(marketplaceMockQuery, instanceMockQuery);

		expect(marketplaceList.find((app) => app.id === 'marketplace-1')).toBeTruthy();
		expect(marketplaceList.find((app) => app.id === 'marketplace-2')).toBeTruthy();
		expect(marketplaceList.find((app) => app.id === 'marketplace-3')).toBeUndefined();
		expect(marketplaceList).toHaveLength(2);

		expect(installedList.find((app) => app.id === 'marketplace-1')).toBeUndefined();
		expect(installedList.find((app) => app.id === 'marketplace-2')).toBeTruthy();
		expect(installedList.find((app) => app.id === 'marketplace-3')).toBeTruthy();
		expect(installedList).toHaveLength(2);

		expect(privateList.find((app) => app.id === 'private-1')).toBeTruthy();
		expect(privateList).toHaveLength(1);
	});
});
