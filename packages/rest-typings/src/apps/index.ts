import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import type {
	AppScreenshot,
	App,
	FeaturedAppsSection,
	ILogItem,
	AppRequestFilter,
	AppRequestsStats,
	PaginatedAppRequests,
} from '@rocket.chat/core-typings';
import { AppSubscriptionStatus } from '@rocket.chat/core-typings';
import { ExternalComponentLocation } from '@rocket.chat/apps-engine/definition/externalComponent/IExternalComponent';

import type { Static } from '../helpers/schemas';
import { type, SchemasForEndpoints } from '../helpers/schemas';

const externalComponentUserInfoSchema = type.object({
	id: type.string(),
	username: type.string(),
	avatarUrl: type.string(),
});

const externalComponentLocationSchema = type.enum(ExternalComponentLocation);

const externalComponentOptionsSchema = type.optional(
	type.object({
		width: type.optional(type.number()),
		height: type.optional(type.number()),
	}),
);

const externalComponentStateSchema = type.optional(
	type.object({
		currentUser: externalComponentUserInfoSchema,
		currentRoom: type.object({
			id: type.string(),
			slugifiedName: type.string(),
			members: type.array(externalComponentUserInfoSchema),
		}),
	}),
);

const externalComponentSchema = type.object({
	appId: type.string(),
	name: type.string(),
	description: type.string(),
	icon: type.string(),
	location: externalComponentLocationSchema,
	url: type.string(),
	options: externalComponentOptionsSchema,
	state: externalComponentStateSchema,
});

const appRequestStatsSchema = type.object({
	appId: type.string(),
	totalSeen: type.number(),
	totalUnseen: type.number(),
});

const purchaseTypeSchema = type.union([type.literal('buy'), type.literal('subscription')]);

const appPricingPlanSchema = type.object({
	perUnit: type.boolean(),
	minimum: type.number(),
	maximum: type.number(),
	price: type.number(),
});

const appStatusSchema = type.enum(AppStatus);

const appSubscriptionStatusSchema = type.enum(AppSubscriptionStatus);

const appLicenseSchema = type.object({
	license: type.string(),
	version: type.number(),
	expireDate: type.string(),
});

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
});

const appPermissionSchema = type.object({
	name: type.string(),
	required: type.optional(type.boolean()),
});

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
);

const permissionSchema = type.object({
	name: type.string(),
	required: type.optional(type.boolean()),
});

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
			request: type.object({}),
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
			url: type.string(),
		}),
		response: type.object({
			app: appSchema,
		}),
	},
} as const satisfies SchemasForEndpoints;

export type AppsEndpoints = {
	'/apps/count': {
		GET: () => Static<(typeof appsSchemas)['GET /apps/count']['response']>;
	};

	'/apps/externalComponents': {
		GET: () => Static<(typeof appsSchemas)['GET /apps/externalComponents']['response']>;
	};

	'/apps/incompatibleModal': {
		GET: (
			params: Static<(typeof appsSchemas)['GET /apps/incompatibleModal']['request']>,
		) => Static<(typeof appsSchemas)['GET /apps/incompatibleModal']['response']>;
	};

	'/apps/:id': {
		GET:
			| ((
					params: Static<(typeof appsSchemas)['GET /apps/:id'][0]['request']>,
			  ) => Static<(typeof appsSchemas)['GET /apps/:id'][0]['response']>)
			| (() => Static<(typeof appsSchemas)['GET /apps/:id'][1]['response']>);
		DELETE: () => Static<(typeof appsSchemas)['DELETE /apps/:id']['response']>;
		POST: (params: {
			marketplace: boolean;
			version: string;
			permissionsGranted?: IPermission[];
			appId: string;
			url?: string;
		}) => Static<(typeof appsSchemas)['POST /apps/:id']['response']>;
	};

	'/apps/actionButtons': {
		GET: () => IUIActionButton[];
	};

	'/apps/languages': {
		GET: () => {
			apps: {
				id: string;
				languages: {
					[key: string]: {
						Params: string;
						Description: string;
						Setting_Name: string;
						Setting_Description: string;
					};
				};
			};
		};
	};

	'/apps/public/:appId/get-sidebar-icon': {
		GET: (params: { icon: string }) => unknown;
	};

	'/apps/:id/settings': {
		GET: () => {
			settings: ISetting[];
		};
		POST: (params: { settings: ISetting[] }) => { updated: ISetting[]; success: boolean };
	};

	'/apps/:id/settings/:settingId': {
		GET: () => {
			setting: ISetting;
		};
		POST: (params: { setting: ISetting }) => { success: boolean };
	};

	'/apps/:id/screenshots': {
		GET: () => {
			screenshots: AppScreenshot[];
		};
	};

	'/apps/:id/languages': {
		GET: () => {
			languages: {
				[key: string]: object;
			};
		};
	};

	'/apps/:id/logs': {
		GET: () => {
			logs: ILogItem[];
		};
	};

	'/apps/:id/apis': {
		GET: () => {
			apis: IApiEndpointMetadata[];
		};
	};

	'/apps/bundles/:id/apps': {
		GET: () => {
			apps: App[];
		};
	};

	'/apps/:id/sync': {
		POST: () => {
			app: App;
		};
	};

	'/apps/:id/status': {
		GET: () => {
			status: string;
		};
		POST: (params: { status: AppStatus }) => {
			status: string;
		};
	};

	'/apps/:id/versions': {
		GET: () => {
			apps: App[];
		};
	};

	'/apps/:id/icon': {
		GET: () => {
			statusCode: 200;
			headers: {
				'Content-Length': number;
				'Content-Type': string;
			};
			body: Buffer;
		};
	};

	'/apps/featured-apps': {
		GET: () => {
			sections: FeaturedAppsSection[];
		};
	};

	'/apps/marketplace': {
		GET: (params: {
			purchaseType?: 'buy' | 'subscription';
			version?: string;
			appId?: string;
			details?: 'true' | 'false';
			isAdminUser?: string;
		}) => App[];
	};

	'/apps/categories': {
		GET: () => {
			createdDate: Date;
			description: string;
			id: string;
			modifiedDate: Date;
			title: string;
		}[];
	};

	'/apps/buildExternalUrl': {
		GET: (params: { purchaseType?: 'buy' | 'subscription'; appId?: string; details?: 'true' | 'false' }) => {
			url: string;
		};
	};

	'/apps/installed': {
		GET: () => { apps: App[] };
	};

	'/apps/buildExternalAppRequest': {
		GET: (params: { appId?: string }) => {
			url: string;
		};
	};

	'/apps/app-request': {
		GET: (params: { appId: string; q?: AppRequestFilter; sort?: string; limit?: number; offset?: number }) => PaginatedAppRequests;
	};

	'/apps/app-request/stats': {
		GET: () => AppRequestsStats;
	};

	'/apps/app-request/markAsSeen': {
		POST: (params: { unseenRequests: Array<string> }) => { succes: boolean };
	};

	'/apps/notify-admins': {
		POST: (params: { appId: string; appName: string; appVersion: string; message: string }) => void;
	};

	'/apps/externalComponentEvent': {
		POST: (params: { externalComponent: string; event: 'IPostExternalComponentOpened' | 'IPostExternalComponentClosed' }) => {
			result: any;
		};
	};

	'/apps/': {
		GET:
			| ((params: { buildExternalUrl: 'true'; purchaseType?: 'buy' | 'subscription'; appId?: string; details?: 'true' | 'false' }) => {
					url: string;
			  })
			| ((params: {
					purchaseType?: 'buy' | 'subscription';
					marketplace?: 'false';
					version?: string;
					appId?: string;
					details?: 'true' | 'false';
			  }) => {
					apps: App[];
			  })
			| ((params: {
					purchaseType?: 'buy' | 'subscription';
					marketplace: 'true';
					version?: string;
					appId?: string;
					details?: 'true' | 'false';
			  }) => App[])
			| ((params: { categories: 'true' }) => {
					createdDate: Date;
					description: string;
					id: string;
					modifiedDate: Date;
					title: string;
			  }[])
			| (() => { apps: App[] });

		POST: (params: {
			appId: string;
			marketplace: boolean;
			version: string;
			permissionsGranted?: IPermission[];
			url?: string;
			downloadOnly?: boolean;
		}) => {
			app: App;
		};
	};
};
