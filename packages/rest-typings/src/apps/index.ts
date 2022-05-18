import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import type { ISetting, AppScreenshot, App } from '@rocket.chat/core-typings';

export type AppsEndpoints = {
	'/apps/externalComponents': {
		GET: () => { externalComponents: IExternalComponent[] };
	};
	'/apps/:id/settings': {
		GET: () => {
			[key: string]: ISetting;
		};
	};

	'/apps/:id/screenshots': {
		GET: () => {
			screenshots: AppScreenshot[];
		};
	};

	'/apps/:id/apis': {
		GET: () => {
			apis: IApiEndpointMetadata[];
		};
	};
	'/apps/:id': {
		GET: (params: { marketplace?: 'true' | 'false'; update?: 'true' | 'false'; appVersion: string }) => {
			app: App;
		};
	};
};
