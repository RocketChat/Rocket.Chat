import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';

export type AppsEndpoints = {
	'/apps/externalComponents': {
		GET: () => { externalComponents: IExternalComponent[] };
	};
};
