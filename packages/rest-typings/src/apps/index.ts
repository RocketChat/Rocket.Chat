import { IApiEndpointMetadata, IApiExample } from '@rocket.chat/apps-engine/definition/api';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { IUIActionButton, UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import {
	AppSubscriptionStatus,
	AppRequestStats,
	PurchaseType,
	AppPricingPlan,
	AppTiers,
	AppLicense,
	AppSubscriptionInfo,
	AppPermission,
	App,
	AppScreenshot,
	ILogItem,
	ILogEntry,
	FeaturedAppsSection,
	AppOverview,
	Latest,
	DetailedDescription,
	DetailedChangelog,
	Author,
	SubscriptionInfo,
	License,
	bundledIn,
	PricingPlan,
	AppRequestFilter,
	PaginatedAppRequests,
	AppRequest,
	Meta,
	AppRequestsStats,
} from '@rocket.chat/core-typings';
import { ExternalComponentLocation, IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent/IExternalComponent';
import { IExternalComponentUserInfo } from '@rocket.chat/apps-engine/client/definition';
import { IExternalComponentOptions } from '@rocket.chat/apps-engine/definition/externalComponent/IExternalComponentOptions';
import { IExternalComponentState } from '@rocket.chat/apps-engine/definition/externalComponent/IExternalComponentState';

import type { EndpointsFromSchemas } from '../helpers/schemas';
import { type, SchemasForEndpoints } from '../helpers/schemas';

const externalComponentUserInfoSchema = type.object({
	id: type.string(),
	username: type.string(),
	avatarUrl: type.string(),
}) satisfies { static: IExternalComponentUserInfo };

const externalComponentLocationSchema = type.enum(ExternalComponentLocation) satisfies { static: ExternalComponentLocation };

const externalComponentOptionsSchema = type.optional(
	type.object({
		width: type.optional(type.number()),
		height: type.optional(type.number()),
	}),
) satisfies { static: IExternalComponentOptions };

const externalComponentStateSchema = type.optional(
	type.object({
		currentUser: externalComponentUserInfoSchema,
		currentRoom: type.object({
			id: type.string(),
			slugifiedName: type.string(),
			members: type.array(externalComponentUserInfoSchema),
		}),
	}),
) satisfies { static: IExternalComponentState };

const externalComponentSchema = type.object({
	appId: type.string(),
	name: type.string(),
	description: type.string(),
	icon: type.string(),
	location: externalComponentLocationSchema,
	url: type.string(),
	options: externalComponentOptionsSchema,
	state: externalComponentStateSchema,
}) satisfies { static: IExternalComponent };

const appRequestStatsSchema = type.object({
	appId: type.string(),
	totalSeen: type.number(),
	totalUnseen: type.number(),
}) satisfies { static: AppRequestStats };

const purchaseTypeSchema = type.union([type.literal('buy'), type.literal('subscription')]) satisfies { static: PurchaseType };

const appTiersSchema = type.object({
	perUnit: type.boolean(),
	minimum: type.number(),
	maximum: type.number(),
	price: type.number(),
}) satisfies { static: AppTiers };

const appPricingPlanSchema = type.object({
	id: type.string(),
	enabled: type.boolean(),
	price: type.number(),
	trialDays: type.number(),
	strategy: type.string(),
	isPerSeat: type.boolean(),
	tiers: type.optional(type.array(appTiersSchema)),
}) satisfies { static: AppPricingPlan };

const appStatusSchema = type.enum(AppStatus) satisfies { static: AppStatus };

const appSubscriptionStatusSchema = type.enum(AppSubscriptionStatus) satisfies { static: AppSubscriptionStatus };

const appLicenseSchema = type.object({
	license: type.string(),
	version: type.number(),
	expireDate: type.string(),
}) satisfies { static: AppLicense };

const appSubscriptionInfoSchema = type.object({
	typeOf: type.string(),
	status: appSubscriptionStatusSchema,
	statusFromBilling: type.boolean(),
	isSeatBased: type.boolean(),
	seats: type.number(),
	maxSeats: type.number(),
	license: appLicenseSchema,
	startDate: type.string(),
	periodEnd: type.string(),
	endDate: type.string(),
	isSubscribedViaBundle: type.boolean(),
}) satisfies { static: AppSubscriptionInfo };

const appPermissionSchema = type.object({
	name: type.string(),
	required: type.optional(type.boolean()),
}) satisfies { static: AppPermission };

const appSchema = type.recursive(
	(appSchema) =>
		type.object({
			id: type.string(),
			iconFileData: type.string(),
			name: type.string(),
			appRequestStats: appRequestStatsSchema,
			author: type.object({
				name: type.string(),
				homepage: type.string(),
				support: type.string(),
			}),
			description: type.string(),
			shortDescription: type.optional(type.string()),
			privacyPolicySummary: type.string(),
			detailedDescription: type.object({
				raw: type.string(),
				rendered: type.string(),
			}),
			detailedChangelog: type.object({
				raw: type.string(),
				rendered: type.string(),
			}),
			categories: type.array(type.string()),
			version: type.string(),
			versionIncompatible: type.optional(type.boolean()),
			price: type.number(),
			purchaseType: purchaseTypeSchema,
			pricingPlans: type.array(appPricingPlanSchema),
			iconFileContent: type.string(),
			installed: type.optional(type.boolean()),
			isEnterpriseOnly: type.optional(type.boolean()),
			isPurchased: type.optional(type.boolean()),
			isSubscribed: type.boolean(),
			bundledIn: type.array(
				type.object({
					bundleId: type.string(),
					bundleName: type.string(),
					apps: type.array(appSchema),
					addonTierId: type.optional(type.string()),
				}),
			),
			marketplaceVersion: type.string(),
			latest: appSchema,
			status: type.optional(appStatusSchema),
			subscriptionInfo: appSubscriptionInfoSchema,
			licenseValidation: type.optional(
				type.object({
					errors: type.record(type.string(), type.string()),
					warnings: type.record(type.string(), type.string()),
				}),
			),
			tosLink: type.string(),
			privacyLink: type.string(),
			marketplace: type.optional(type.unknown()),
			modifiedAt: type.string(),
			permissions: type.array(appPermissionSchema),
			languages: type.array(type.string()),
			createdDate: type.string(),
			requestedEndUser: type.optional(type.boolean()),
			private: type.boolean(),
			documentationUrl: type.string(),
			migrated: type.boolean(),
		}),
	{ $id: 'App' },
) satisfies { static: App };

const permissionSchema = type.object({
	name: type.string(),
	required: type.optional(type.boolean()),
}) satisfies { static: IPermission };

const uiActionButtonSchema = type.object({
	appId: type.string(),
	actionId: type.string(),
	labelI18n: type.string(),
	context: type.enum(UIActionButtonContext),
}) satisfies { static: IUIActionButton };

const settingSchema = type.object({
	id: type.string(),
	type: type.enum(SettingType),
	packageValue: type.string(),
	required: type.boolean(),
	public: type.boolean(),
	i18nLabel: type.string(),
}) satisfies { static: ISetting };

const appScreenshotSchema = type.object({
	id: type.string(),
	appId: type.string(),
	fileName: type.string(),
	accessUrl: type.string(),
	thumbnailUrl: type.string(),
	createdAt: type.string(),
	modifiedAt: type.string(),
}) satisfies { static: AppScreenshot };

const logEntrySchema = type.object({
	args: type.array(type.string()),
	caller: type.string(),
	severity: type.string(),
	timestamp: type.string(),
}) satisfies { static: ILogEntry };

const logItemSchema = type.object({
	appId: type.string(),
	endTime: type.string(),
	entries: type.array(logEntrySchema),
	instanceId: type.string(),
	method: type.string(),
	startTime: type.string(),
	totalTime: type.number(),
	_createdAt: type.string(),
	_id: type.string(),
	_updatedAt: type.string(),
}) satisfies { static: ILogItem };

const apiExampleSchema = type.object({
	params: type.optional(type.record(type.string(), type.string())),
	query: type.optional(type.record(type.string(), type.string())),
	headers: type.optional(type.record(type.string(), type.string())),
	content: type.optional(type.any()),
}) satisfies { static: IApiExample };

const apiEndpointMetadataSchema = type.object({
	path: type.string(),
	computedPath: type.string(),
	methods: type.array(type.string()),
	examples: type.optional(type.record(type.string(), apiExampleSchema)),
}) satisfies { static: IApiEndpointMetadata };

const detailedDescriptionSchema = type.object({
	raw: type.string(),
	rendered: type.string(),
}) satisfies { static: DetailedDescription };

const detailedChangelogSchema = type.object({
	raw: type.string(),
	rendered: type.string(),
}) satisfies { static: DetailedChangelog };

const authorSchema = type.object({
	name: type.string(),
	support: type.string(),
	homepage: type.string(),
}) satisfies { static: Author };

const licenseSchema = type.object({
	license: type.string(),
	version: type.number(),
	expireDate: type.string(),
}) satisfies { static: License };

const subscriptionInfoSchema = type.object({
	typeOf: type.string(),
	status: appSubscriptionStatusSchema,
	statusFromBilling: type.boolean(),
	isSeatBased: type.boolean(),
	seats: type.number(),
	maxSeats: type.number(),
	license: licenseSchema,
	startDate: type.string(),
	periodEnd: type.string(),
	endDate: type.string(),
	externallyManaged: type.boolean(),
	isSubscribedViaBundle: type.boolean(),
}) satisfies { static: SubscriptionInfo };

const latestSchema = type.object({
	internalId: type.string(),
	id: type.string(),
	name: type.string(),
	nameSlug: type.string(),
	version: type.string(),
	categories: type.array(type.string()),
	languages: type.array(type.string()),
	description: type.string(),
	privacyPolicySummary: type.string(),
	detailedDescription: detailedDescriptionSchema,
	detailedChangelog: detailedChangelogSchema,
	requiredApiVersion: type.string(),
	permissions: type.array(permissionSchema),
	author: authorSchema,
	classFile: type.string(),
	iconFile: type.string(),
	iconFileData: type.string(),
	status: appStatusSchema,
	isVisible: type.boolean(),
	createdDate: type.string(),
	modifiedDate: type.string(),
	isPurchased: type.boolean(),
	isSubscribed: type.boolean(),
	subscriptionInfo: subscriptionInfoSchema,
	compileJobId: type.string(),
	compiled: type.boolean(),
	tosLink: type.string(),
	privacyLink: type.string(),
}) satisfies { static: Latest };

const bundledInSchema = type.object({
	bundleId: type.string(),
	bundleName: type.string(),
	apps: type.array(appSchema),
	addonTierId: type.string(),
}) satisfies { static: bundledIn };

const pricingPlanSchema = type.object({
	id: type.string(),
	enabled: type.boolean(),
	price: type.number(),
	trialDays: type.number(),
	strategy: type.string(),
	isPerSeat: type.boolean(),
}) satisfies { static: PricingPlan };

const appOverviewSchema = type.object({
	appId: type.string(),
	latest: latestSchema,
	isAddon: type.boolean(),
	addonId: type.string(),
	isEnterpriseOnly: type.boolean(),
	isBundle: type.boolean(),
	bundledAppIds: type.array(type.any()),
	bundledIn: type.array(bundledInSchema),
	isPurchased: type.boolean(),
	isSubscribed: type.boolean(),
	subscriptionInfo: subscriptionInfoSchema,
	price: type.number(),
	purchaseType: type.string(),
	pricingPlans: type.array(pricingPlanSchema),
	isUsageBased: type.boolean(),
	createdAt: type.string(),
	modifiedAt: type.string(),
	iconFileContent: type.optional(type.string()),
	marketplaceVersion: type.optional(type.string()),
	marketplace: type.optional(type.unknown()),
}) satisfies { static: AppOverview };

const featuredAppsSectionSchema = type.object({
	i18nLabel: type.string(),
	slug: type.string(),
	apps: type.array(appOverviewSchema),
}) satisfies { static: FeaturedAppsSection };

const appRequestFilterSchema = type.union([
	type.literal(''),
	type.literal('unseen'),
	type.literal('seen'),
	type.literal('notification-sent'),
	type.literal('notification-not-sent'),
]) satisfies { static: AppRequestFilter };

const appRequestEndUserSchema = type.object({
	id: type.string(),
	username: type.string(),
	name: type.string(),
	nickname: type.string(),
	emails: type.array(type.string()),
});

const appRequestSchema = type.object({
	id: type.string(),
	appId: type.string(),
	requester: appRequestEndUserSchema,
	admins: type.array(appRequestEndUserSchema),
	workspaceId: type.string(),
	message: type.string(),
	seen: type.boolean(),
	seenAt: type.string(),
	notificationSent: type.boolean(),
	notificationSentAt: type.string(),
	createdDate: type.string(),
}) satisfies { static: AppRequest };

const metaSchema = type.object({
	limit: type.union([type.literal(25), type.literal(50), type.literal(100)]),
	offset: type.number(),
	sort: type.string(),
	filter: type.string(),
	total: type.number(),
}) satisfies { static: Meta };

const paginatedAppRequestsSchema = type.object({
	data: type.array(appRequestSchema),
	meta: metaSchema,
}) satisfies { static: PaginatedAppRequests };

const appRequestsStatsSchema = type.object({
	data: type.object({
		totalSeen: type.number(),
		totalUnseen: type.number(),
	}),
}) satisfies { static: AppRequestsStats };

const appsSchemas = {
	'GET /apps/count': {
		response: type.object({
			totalMarketplaceEnabled: type.number(),
			totalPrivateEnabled: type.number(),
			maxMarketplaceApps: type.number(),
			maxPrivateApps: type.number(),
		}),
	},
	'GET /apps/externalComponents': {
		response: type.object({
			externalComponents: type.array(externalComponentSchema),
		}),
	},
	'GET /apps/incompatibleModal': {
		request: type.object({
			appId: type.string(),
			appVersion: type.string(),
			action: type.string(),
		}),
		response: type.object({
			url: type.string(),
		}),
	},
	'GET /apps/:id': [
		{
			request: type.object({
				marketplace: type.optional(type.union([type.literal('true'), type.literal('false')])),
				version: type.optional(type.string()),
				appVersion: type.optional(type.string()),
				update: type.optional(type.union([type.literal('true'), type.literal('false')])),
			}),
			response: type.object({
				app: appSchema,
			}),
		},
		{
			response: type.object({
				app: appSchema,
			}),
		},
	],
	'DELETE /apps/:id': {
		response: type.object({
			app: appSchema,
			success: type.boolean(), // TODO: I think this is redundant
		}),
	},
	'POST /apps/:id': {
		request: type.object({
			marketplace: type.boolean(),
			version: type.string(),
			permissionsGranted: type.optional(type.array(permissionSchema)),
			appId: type.string(),
			url: type.optional(type.string()),
		}),
		response: type.object({
			app: appSchema,
		}),
	},
	'GET /apps/actionButtons': {
		response: type.array(uiActionButtonSchema),
	},
	'GET /apps/languages': {
		response: type.object({
			apps: type.object({
				id: type.string(),
				languages: type.record(
					type.string(),
					type.object({
						Params: type.string(),
						Description: type.string(),
						Setting_Name: type.string(),
						Setting_Description: type.string(),
					}),
				),
			}),
		}),
	},
	'GET /apps/public/:appId/get-sidebar-icon': {
		request: type.object({
			icon: type.string(),
		}),
		response: type.unknown(),
	},
	'GET /apps/:id/settings': {
		response: type.object({
			settings: type.array(settingSchema),
		}),
	},
	'POST /apps/:id/settings': {
		request: type.object({
			settings: type.array(settingSchema),
		}),
		response: type.object({
			updated: type.array(settingSchema),
			success: type.boolean(),
		}),
	},
	'GET /apps/:id/settings/:settingId': {
		response: type.object({
			setting: settingSchema,
		}),
	},
	'POST /apps/:id/settings/:settingId': {
		request: type.object({
			setting: settingSchema,
		}),
		response: type.object({
			success: type.boolean(),
		}),
	},
	'GET /apps/:id/screenshots': {
		response: type.object({
			screenshots: type.array(appScreenshotSchema),
		}),
	},
	'GET /apps/:id/languages': {
		response: type.object({
			languages: type.record(type.string(), type.object({})),
		}),
	},
	'GET /apps/:id/logs': {
		response: type.object({
			logs: type.array(logItemSchema),
		}),
	},
	'GET /apps/:id/apis': {
		response: type.object({
			apis: type.array(apiEndpointMetadataSchema),
		}),
	},
	'GET /apps/bundles/:id/apps': {
		response: type.object({
			apps: type.array(appSchema),
		}),
	},
	'POST /apps/:id/sync': {
		response: type.object({
			apps: type.array(appSchema),
		}),
	},
	'GET /apps/:id/status': {
		response: type.object({
			status: type.string(),
		}),
	},
	'POST /apps/:id/status': {
		request: type.object({
			status: appStatusSchema,
		}),
		response: type.object({
			status: type.string(),
		}),
	},
	'GET /apps/:id/versions': {
		response: type.object({
			apps: type.array(appSchema),
		}),
	},
	'GET /apps/:id/icon': {
		response: type.object({
			statusCode: type.literal(200),
			headers: type.object({
				'Content-Length': type.number(),
				'Content-Type': type.string(),
			}),
			body: type.uint8Array(),
		}),
	},
	'GET /apps/featured-apps': {
		response: type.object({
			sections: type.array(featuredAppsSectionSchema),
		}),
	},
	'GET /apps/marketplace': {
		request: type.object({
			purchaseType: type.optional(purchaseTypeSchema),
			version: type.optional(type.string()),
			appId: type.optional(type.string()),
			details: type.optional(type.union([type.literal('true'), type.literal('false')])),
			isAdminUser: type.optional(type.string()),
		}),
		response: type.array(appSchema),
	},
	'GET /apps/categories': {
		response: type.object({
			createdDate: type.date(),
			description: type.string(),
			id: type.string(),
			modifiedDate: type.date(),
			title: type.string(),
		}),
	},
	'GET /apps/buildExternalUrl': {
		request: type.object({
			purchaseType: type.optional(purchaseTypeSchema),
			appId: type.optional(type.string()),
			details: type.optional(type.union([type.literal('true'), type.literal('false')])),
		}),
		response: type.object({
			url: type.string(),
		}),
	},
	'GET /apps/installed': {
		response: type.object({
			apps: type.array(appSchema),
		}),
	},
	'GET /apps/buildExternalAppRequest': {
		request: type.object({
			appId: type.optional(type.string()),
		}),
		response: type.object({
			url: type.string(),
		}),
	},
	'GET /apps/app-request': {
		request: type.object({
			appId: type.optional(type.string()),
			q: type.optional(appRequestFilterSchema),
			sort: type.optional(type.string()),
			limit: type.optional(type.number()),
			offset: type.optional(type.number()),
		}),
		response: paginatedAppRequestsSchema,
	},
	'GET /apps/app-request/stats': {
		response: appRequestsStatsSchema,
	},
	'POST /apps/app-request/markAsSeen': {
		request: type.object({
			unseenRequests: type.array(type.string()),
		}),
		response: type.object({
			success: type.boolean(), // TODO: I think this is redundant
		}),
	},
	'POST /apps/notify-admins': {
		request: type.object({
			appId: type.string(),
			appName: type.string(),
			appVersion: type.string(),
			message: type.string(),
		}),
		response: type.void(),
	},
	'POST /apps/externalComponentEvent': {
		request: type.object({
			externalComponent: type.string(),
			event: type.union([type.literal('IPostExternalComponentOpened'), type.literal('IPostExternalComponentClosed')]),
		}),
		response: type.any(),
	},
	'GET /apps/': [
		{
			request: type.object({
				buildExternalUrl: type.literal('true'),
				purchaseType: purchaseTypeSchema,
				appId: type.optional(type.string()),
				details: type.optional(type.union([type.literal('true'), type.literal('false')])),
			}),
			response: type.object({
				url: type.string(),
			}),
		},
		{
			request: type.object({
				purchaseType: purchaseTypeSchema,
				marketplace: type.optional(type.literal('false')),
				version: type.optional(type.string()),
				appId: type.optional(type.string()),
				details: type.optional(type.union([type.literal('true'), type.literal('false')])),
			}),
			response: type.object({
				apps: type.array(appSchema),
			}),
		},
		{
			request: type.object({
				purchaseType: purchaseTypeSchema,
				marketplace: type.literal('true'),
				version: type.optional(type.string()),
				appId: type.optional(type.string()),
				details: type.optional(type.union([type.literal('true'), type.literal('false')])),
			}),
			response: type.array(appSchema),
		},
		{
			request: type.object({
				categories: type.literal('true'),
			}),
			response: type.array(
				type.object({
					createdDate: type.date(),
					description: type.string(),
					id: type.string(),
					modifiedDate: type.date(),
					title: type.string(),
				}),
			),
		},
		{
			response: type.object({
				apps: type.array(appSchema),
			}),
		},
	],
	'POST /apps/': {
		request: type.object({
			appId: type.string(),
			marketplace: type.boolean(),
			version: type.string(),
			permissionsGranted: type.optional(type.array(permissionSchema)),
			url: type.optional(type.string()),
			downloadOnly: type.optional(type.boolean()),
		}),
		response: type.object({
			app: appSchema,
		}),
	},
} as const satisfies SchemasForEndpoints;

export type AppsEndpoints = EndpointsFromSchemas<typeof appsSchemas>;
