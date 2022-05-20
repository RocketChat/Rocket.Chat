import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

export type AppsEndpoints = {
	'/apps/externalComponents': {
		GET: () => { externalComponents: IExternalComponent[] };
	};
	'/apps/actionButtons': {
		GET: () => IUIActionButton[];
	};
	'/apps/public/:appId/get-sidebar-icon': {
		GET: (params: { icon: string }) => unknown;
	};
};
