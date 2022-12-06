import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import type { AppScreenshot, App, FeaturedAppsSection, ILogItem } from '@rocket.chat/core-typings';

export type AppsEndpoints = {
	'/apps/externalComponents': {
		GET: () => { externalComponents: IExternalComponent[] };
	};

	'/apps/incompatibleModal': {
		GET: (params: { appId: string; appVersion: string; action: string }) => { url: string };
	};

	'/apps/:id': {
		GET:
			| ((params: { marketplace?: 'true' | 'false'; version?: string; appVersion?: string; update?: 'true' | 'false' }) => {
					app: App;
			  })
			| (() => {
					app: App;
			  });
		DELETE: () => {
			app: App;
			success: boolean;
		};
		POST: (params: { marketplace: boolean; version: string; permissionsGranted: IPermission[]; appId: string }) => {
			app: App;
		};
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
		POST: (params: { status: AppStatus }) => {
			status: string;
		};
	};

	'/apps/:id/versions': {
		GET: () => {
			apps: App[];
		};
	};

	'/apps/featured-apps': {
		GET: () => {
			sections: FeaturedAppsSection[];
		};
	};

	'/apps': {
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
			| ((params: { categories: 'true' | 'false' }) => {
					createdDate: Date;
					description: string;
					id: string;
					modifiedDate: Date;
					title: string;
			  }[])
			| (() => { apps: App[] });

		POST: (params: { appId: string; marketplace: boolean; version: string; permissionsGranted: IPermission[] }) => {
			app: App;
		};
	};
};
