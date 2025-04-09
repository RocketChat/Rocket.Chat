import type { AppSubscriptionStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import { AppInfoField } from './AppInfoField';

export default {
	title: 'views/Audit/AppInfoField',
	component: AppInfoField,
	args: {
		appId: 'app-id',
	},
	decorators: [
		mockAppRoot()
			.withEndpoint('GET', '/apps/:id', () => ({
				app: {
					name: 'App Name',
					id: '',
					iconFileData: '',
					appRequestStats: {
						appId: '',
						totalSeen: 0,
						totalUnseen: 0,
					},
					author: {
						name: '',
						homepage: '',
						support: '',
					},
					description: '',
					privacyPolicySummary: '',
					detailedDescription: {
						raw: '',
						rendered: '',
					},
					detailedChangelog: {
						raw: '',
						rendered: '',
					},
					categories: [],
					version: '',
					price: 0,
					purchaseType: 'buy' as const,
					pricingPlans: [],
					iconFileContent: '',
					isSubscribed: false,
					bundledIn: [],
					marketplaceVersion: '',
					// Recursive typem expect an App type here
					latest: undefined as any,
					subscriptionInfo: {
						typeOf: '',
						status: 'Active' as AppSubscriptionStatus,
						statusFromBilling: false,
						isSeatBased: false,
						seats: 0,
						maxSeats: 0,
						license: {
							license: '',
							version: 0,
							expireDate: '',
						},
						startDate: '',
						periodEnd: '',
						endDate: '',
						externallyManaged: false,
						isSubscribedViaBundle: false,
					},
					tosLink: '',
					privacyLink: '',
					modifiedAt: '',
					permissions: [],
					languages: [],
					createdDate: '',
					private: false,
					documentationUrl: '',
					migrated: false,
				},
			}))
			.withTranslations('en', 'core', { App_name: 'App Name' })
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof AppInfoField>;

export const Default: StoryFn<typeof AppInfoField> = (args) => <AppInfoField {...args} />;

export const NoAppInfo: StoryFn<typeof AppInfoField> = (args) => <AppInfoField {...args} />;

NoAppInfo.decorators = [mockAppRoot().withTranslations('en', 'core', { App_id: 'App Id' }).buildStoryDecorator()];
