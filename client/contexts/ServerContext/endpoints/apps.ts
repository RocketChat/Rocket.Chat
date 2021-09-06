import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';

export type AppsEndpoints = {
	'/apps/externalComponents': {
		GET: (params: Record<string, never>) => { externalComponents: IExternalComponent[] };
	};
};
