import { faker } from '@faker-js/faker';
import type { AppStatus } from '@rocket.chat/apps';
import { type App, type AppSubscriptionInfo, AppSubscriptionStatus } from '@rocket.chat/core-typings';

import { createFakeApp } from '../data';

// Zero-value of the subscriptionInfo field on marketplace-api
// returned by the API when the app has no value assigned to the field
const subscriptionInfoZero = (): AppSubscriptionInfo => ({
	typeOf: '',
	status: '' as AppSubscriptionStatus, // real value that is sent currently, enum should be updated
	statusFromBilling: false,
	isSeatBased: false,
	seats: 0,
	maxSeats: 0,
	license: {
		license: '',
		version: 0,
		expireDate: '0001-01-01T00:00:00Z',
	},
	startDate: '0001-01-01T00:00:00Z',
	periodEnd: '0001-01-01T00:00:00Z',
	endDate: '0001-01-01T00:00:00Z',
	// externallyManaged: false, // TODO add to typings
	isSubscribedViaBundle: false,
});

/*
 * Creates a fake record of an app that has been bought from the Marketplace
 */
export function createFakeAppBought(partial: Partial<App> = {}): App {
	const app = createFakeApp({
		isPurchased: true,
		isSubscribed: false,
		purchaseType: 'buy',
		// isUsageBased: false, // TODO add to typings
		subscriptionInfo: subscriptionInfoZero(),
		...partial,
	});

	return app;
}

export function createFakeAppSubscribed(partial: Partial<App> = {}): App {
	const app = createFakeApp({
		isSubscribed: true,
		isPurchased: false,
		purchaseType: 'subscription',
		subscriptionInfo: {
			typeOf: 'app',
			status: AppSubscriptionStatus.Active,
			statusFromBilling: faker.datatype.boolean(),
			isSeatBased: faker.datatype.boolean(),
			seats: faker.number.int({ min: 0, max: 50 }),
			maxSeats: faker.number.int({ min: 50, max: 100 }),
			license: {
				license: faker.lorem.word(),
				version: faker.number.int({ min: 0, max: 3 }),
				expireDate: faker.date.future().toISOString(),
			},
			startDate: faker.date.past().toISOString(),
			periodEnd: faker.date.future().toISOString(),
			endDate: faker.date.future().toISOString(),
			isSubscribedViaBundle: faker.datatype.boolean(),
		},
		...partial,
	});

	return app;
}

export function createFakeAppInstalledMarketplace(partial: Partial<App> = {}): App {
	const app = createFakeAppBought({
		installed: true,
		private: false,
		status: 'manually_enabled' as AppStatus.MANUALLY_ENABLED,
		licenseValidation: {
			errors: {},
			warnings: {},
		},
		...partial,
	});

	return app;
}

export function createFakeAppPrivate(partial: Partial<App> = {}): App {
	const app = createFakeApp({
		installed: true,
		private: true,
		status: 'manually_enabled' as AppStatus.MANUALLY_ENABLED,
		// Fields from marketplace
		appRequestStats: undefined,
		shortDescription: undefined,
		price: undefined,
		pricingPlans: undefined,
		purchaseType: undefined,
		isPurchased: undefined,
		isSubscribed: undefined,
		tosLink: undefined,
		bundledIn: undefined,
		privacyLink: undefined,
		privacyPolicySummary: undefined,
		documentationUrl: undefined,
		detailedChangelog: undefined,
		detailedDescription: undefined,
		categories: undefined,
		versionIncompatible: undefined,
		marketplaceVersion: undefined,
		latest: undefined,
		subscriptionInfo: undefined,
		...partial,
	});

	return app;
}
