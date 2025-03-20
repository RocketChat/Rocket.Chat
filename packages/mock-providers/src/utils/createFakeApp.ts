import { faker } from '@faker-js/faker';
import { AppSubscriptionStatus } from '@rocket.chat/core-typings';
import type { App } from '@rocket.chat/core-typings';

export function createFakeApp(partialApp: Partial<App> = {}): App {
	const appId = faker.database.mongodbObjectId();

	const app: App = {
		id: appId,
		iconFileData: faker.image.dataUri(),
		name: faker.commerce.productName(),
		appRequestStats: {
			appId: partialApp.id ?? appId,
			totalSeen: faker.number.int({ min: 0, max: 100 }),
			totalUnseen: faker.number.int({ min: 0, max: 100 }),
		},
		author: {
			name: faker.company.name(),
			homepage: faker.internet.url(),
			support: faker.internet.email(),
		},
		description: faker.lorem.paragraph(),
		shortDescription: faker.lorem.sentence(),
		privacyPolicySummary: faker.lorem.sentence(),
		detailedDescription: {
			raw: faker.lorem.paragraph(),
			rendered: faker.lorem.paragraph(),
		},
		detailedChangelog: {
			raw: faker.lorem.paragraph(),
			rendered: faker.lorem.paragraph(),
		},
		categories: [],
		version: faker.system.semver(),
		versionIncompatible: faker.datatype.boolean(),
		price: faker.number.float({ min: 0, max: 1000 }),
		purchaseType: faker.helpers.arrayElement(['buy', 'subscription']),
		pricingPlans: [],
		iconFileContent: faker.image.dataUri(),
		isSubscribed: faker.datatype.boolean(),
		bundledIn: [],
		marketplaceVersion: faker.system.semver(),
		get latest() {
			return app;
		},
		subscriptionInfo: {
			typeOf: faker.lorem.word(),
			status: faker.helpers.enumValue(AppSubscriptionStatus),
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
		tosLink: faker.internet.url(),
		privacyLink: faker.internet.url(),
		modifiedAt: faker.date.recent().toISOString(),
		permissions: faker.helpers.multiple(() => ({
			name: faker.hacker.verb(),
			required: faker.datatype.boolean(),
		})),
		languages: faker.helpers.multiple(() => faker.location.countryCode()),
		createdDate: faker.date.past().toISOString(),
		private: faker.datatype.boolean(),
		documentationUrl: faker.internet.url(),
		migrated: faker.datatype.boolean(),
		...partialApp,
	};

	return app;
}
